"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return { supabase };
}

function revalidateBookingSurfaces(bookingId?: string, userId?: string) {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/overview");
  revalidatePath("/account");
  if (bookingId) revalidatePath(`/admin/bookings/${bookingId}`);
  if (bookingId) revalidatePath(`/bookings/${bookingId}`);
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

/** Cancel a booking. If the underlying trip/package still has the spot
 *  reserved (i.e. spots_left was decremented for this booking), this
 *  increments spots_left back so the spot is freed.
 *  Status flips: requested|confirmed → cancelled.
 *  Refunded bookings can't be cancelled (already terminal). */
export async function cancelBooking(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("Missing booking id.");

  const { supabase } = await requireAdmin();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, status, item_type, item_id, user_id")
    .eq("id", id)
    .single();
  if (fetchErr || !booking) throw new Error("Booking not found.");
  if (booking.status === "cancelled" || booking.status === "refunded") {
    throw new Error(`Booking is already ${booking.status}.`);
  }

  // Flip booking status. We append the cancellation reason to a future
  // admin_notes column if one exists; for v1 we just record the status.
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (updateErr) throw updateErr;

  // Free the spot back on the underlying item.
  if (booking.item_type === "package") {
    const { data: pkg } = await supabase
      .from("packages")
      .select("spots_left, spots_total")
      .eq("id", booking.item_id)
      .single();
    if (pkg && pkg.spots_left < pkg.spots_total) {
      await supabase
        .from("packages")
        .update({ spots_left: pkg.spots_left + 1 })
        .eq("id", booking.item_id);
    }
  } else if (booking.item_type === "trip") {
    const { data: trip } = await supabase
      .from("trips")
      .select("spots_left, spots_total")
      .eq("id", booking.item_id)
      .single();
    if (trip && trip.spots_left < trip.spots_total) {
      await supabase
        .from("trips")
        .update({ spots_left: trip.spots_left + 1 })
        .eq("id", booking.item_id);
    }
  }

  // Suppress unused-var warning while keeping intent clear.
  void reason;

  revalidateBookingSurfaces(id, booking.user_id);
  redirect(`/admin/bookings/${id}?cancelled=1`);
}

/** Mark a booking as refunded. Real money movement happens via payments
 *  admin (T9.10 / Epic 7) - this is the status-only flip for now. */
export async function refundBooking(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing booking id.");

  const { supabase } = await requireAdmin();
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, status, user_id")
    .eq("id", id)
    .single();
  if (fetchErr || !booking) throw new Error("Booking not found.");
  if (booking.status === "refunded") {
    throw new Error("Booking already refunded.");
  }

  const { error: updateErr } = await supabase
    .from("bookings")
    .update({ status: "refunded" })
    .eq("id", id);
  if (updateErr) throw updateErr;

  revalidateBookingSurfaces(id, booking.user_id);
  redirect(`/admin/bookings/${id}?refunded=1`);
}
