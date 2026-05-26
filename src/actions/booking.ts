"use server";

import { createClient } from "@/lib/supabase/server";
import {
  sendBookingConfirmedEmail,
  sendBookingReceivedEmail,
} from "@/lib/email";
import type { ItemType } from "@/types/db";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://packuptrip.vercel.app";

/** Create a booking via the DB RPC, then fire confirmation emails to both
 *  the joiner and the host. Returns the new booking ID or an error string. */
export async function confirmBooking(
  itemType: ItemType,
  itemId: string,
): Promise<{ bookingId: string | null; error: string | null }> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { bookingId: null, error: "Please sign in to book." };

  // Create the booking
  const { data: bookingId, error: rpcError } = await supabase.rpc(
    "create_booking",
    { p_item_type: itemType, p_item_id: itemId },
  );

  if (rpcError) {
    const msg = friendlyError(rpcError.code, rpcError.message);
    return { bookingId: null, error: msg };
  }
  if (!bookingId) {
    return { bookingId: null, error: "Something went wrong. Please try again." };
  }

  // ── Fire emails in the background (don't block redirect) ─────────────────
  fireEmails(supabase, itemType, itemId, user.id, bookingId).catch((e) =>
    console.error("[confirmBooking] email error:", e),
  );

  return { bookingId: String(bookingId), error: null };
}

// ─── Email fire (best-effort, never throws) ───────────────────────────────────

async function fireEmails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  itemType: ItemType,
  itemId: string,
  joinerId: string,
  bookingId: string,
) {
  // Fetch joiner profile
  const { data: joiner } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", joinerId)
    .single();

  if (!joiner) return;

  if (itemType === "trip") {
    // Fetch trip + host profile
    const { data: trip } = await supabase
      .from("trips")
      .select("title, location, start_date, host_id")
      .eq("id", itemId)
      .single();
    if (!trip) return;

    const { data: host } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", trip.host_id)
      .single();

    const startDate = new Date(trip.start_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Joiner gets booking confirmation
    sendBookingConfirmedEmail({
      joinerEmail: joiner.email,
      joinerName: joiner.name,
      tripTitle: trip.title,
      tripLocation: trip.location,
      startDate,
      bookingUrl: `${BASE_URL}/bookings/${bookingId}`,
    }).catch(console.error);

    // Host gets a new-joiner notification
    if (host) {
      sendBookingReceivedEmail({
        hostEmail: host.email,
        hostName: host.name,
        joinerName: joiner.name,
        tripTitle: trip.title,
        tripLocation: trip.location,
        joinersUrl: `${BASE_URL}/host/trips/${itemId}/joiners`,
      }).catch(console.error);
    }
  } else {
    // Package booking — no host to notify, just confirm to the joiner
    const { data: pkg } = await supabase
      .from("packages")
      .select("title, location, start_date")
      .eq("id", itemId)
      .single();
    if (!pkg) return;

    const startDate = new Date(pkg.start_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    sendBookingConfirmedEmail({
      joinerEmail: joiner.email,
      joinerName: joiner.name,
      tripTitle: pkg.title,
      tripLocation: pkg.location,
      startDate,
      bookingUrl: `${BASE_URL}/bookings/${bookingId}`,
    }).catch(console.error);
  }
}

// ─── Error message mapping (mirrors BookingForm) ──────────────────────────────

function friendlyError(code: string, message: string): string {
  if (code === "P0001") {
    if (message.includes("already")) return "You've already booked this trip.";
    if (message.includes("sold out")) return "Sorry, this trip is now full.";
    if (message.includes("own")) return "You can't book your own trip.";
  }
  return message ?? "Something went wrong. Please try again.";
}
