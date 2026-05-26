"use server";

import { createClient } from "@/lib/supabase/server";
import type { TripMessage } from "@/types/db";

export type TripMember = {
  id: string;
  name: string;
  avatar_url: string | null;
  is_host: boolean;
};

/** Load all messages for a trip chat */
export async function getTripMessages(tripId: string): Promise<TripMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })
    .returns<TripMessage[]>();
  return data ?? [];
}

/** Load all chat members (host + active joiners) with profiles */
export async function getTripChatMembers(tripId: string): Promise<TripMember[]> {
  const supabase = await createClient();

  // Get host
  const { data: trip } = await supabase
    .from("trips")
    .select("host_id, profiles!trips_host_id_fkey(id, name, avatar_url)")
    .eq("id", tripId)
    .single<{ host_id: string; profiles: { id: string; name: string; avatar_url: string | null } | null }>();

  // Get joiners
  const { data: bookings } = await supabase
    .from("bookings")
    .select("user_id, profiles!bookings_user_id_fkey(id, name, avatar_url)")
    .eq("item_id", tripId)
    .eq("item_type", "trip")
    .in("status", ["requested", "confirmed"])
    .returns<{ user_id: string; profiles: { id: string; name: string; avatar_url: string | null } | null }[]>();

  const members: TripMember[] = [];

  if (trip?.profiles) {
    members.push({ ...trip.profiles, is_host: true });
  }

  for (const b of bookings ?? []) {
    if (b.profiles && b.profiles.id !== trip?.host_id) {
      members.push({ ...b.profiles, is_host: false });
    }
  }

  return members;
}

/** Send a message to the trip chat — returns the saved row so the client can broadcast it */
export async function sendTripMessage(
  tripId: string,
  body: string,
): Promise<{ message: TripMessage | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: null, error: "Not signed in" };

  const trimmed = body.trim();
  if (!trimmed) return { message: null, error: "Message cannot be empty" };
  if (trimmed.length > 2000) return { message: null, error: "Message too long" };

  const { data, error } = await supabase
    .from("trip_messages")
    .insert({ trip_id: tripId, sender_id: user.id, body: trimmed })
    .select()
    .single<TripMessage>();

  if (error) {
    console.error("sendTripMessage:", error);
    return { message: null, error: error.message };
  }
  return { message: data, error: null };
}

/** Check if current user is a member of the trip chat */
export async function isTripChatMember(tripId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .rpc("is_trip_chat_member", { p_trip_id: tripId });
  return !!data;
}

/** Host (or sender) soft-deletes a message */
export async function deleteTripMessage(
  messageId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("trip_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) {
    console.error("deleteTripMessage:", error);
    return { error: error.message };
  }
  return { error: null };
}

/** Host removes a member by cancelling their booking(s) via the existing RPC */
export async function removeTripMember(
  tripId: string,
  memberId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Find active booking(s) for this member on this trip
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("item_id", tripId)
    .eq("item_type", "trip")
    .eq("user_id", memberId)
    .in("status", ["requested", "confirmed"]);

  if (!bookings?.length) return { error: "No active booking found for this member" };

  // host_cancel_booking RPC handles auth check + spot restoration atomically
  for (const booking of bookings) {
    const { error } = await supabase.rpc("host_cancel_booking", { p_booking_id: booking.id });
    if (error) {
      console.error("removeTripMember:", error);
      return { error: error.message };
    }
  }

  return { error: null };
}
