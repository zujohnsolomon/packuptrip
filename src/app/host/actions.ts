"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItineraryDay, TripStatus } from "@/types/db";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to host a trip.");
  return { supabase, userId: user.id };
}

function revalidateTripSurfaces(tripId?: string) {
  revalidatePath("/host/trips");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/overview");
  revalidatePath("/admin", "layout");
  revalidatePath("/trips");
  revalidatePath("/search");
  if (tripId) revalidatePath(`/host/trips/${tripId}`);
  if (tripId) revalidatePath(`/trips/${tripId}`);
  if (tripId) revalidatePath(`/admin/approvals/${tripId}`);
}

/** Parse the host trip form. Same shape as PackageEditor but uses the
 *  trip column names (price_per_share instead of price). Throws on invalid
 *  input with friendly messages. */
function readTripForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const daysStr = String(formData.get("days") ?? "").trim();
  const priceStr = String(formData.get("price_per_share") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim();
  const spotsTotalStr = String(formData.get("spots_total") ?? "").trim();
  const spotsLeftStr = String(formData.get("spots_left") ?? "").trim();
  const imagesJson = String(formData.get("images_json") ?? "[]");
  const itineraryJson = String(formData.get("itinerary_json") ?? "[]");
  const tagsRaw = String(formData.get("tags") ?? "");
  const includesRaw = String(formData.get("includes") ?? "");

  if (title.length < 3) throw new Error("Give your trip a title.");
  if (location.length < 2) throw new Error("Where is the trip?");
  if (!startDate) throw new Error("Pick a start date.");
  const days = Number(daysStr);
  const pricePerShare = Number(priceStr);
  const spotsTotal = Number(spotsTotalStr);
  const spotsLeft = spotsLeftStr === "" ? spotsTotal : Number(spotsLeftStr);
  if (!Number.isFinite(days) || days <= 0)
    throw new Error("Days must be a positive number.");
  if (!Number.isFinite(pricePerShare) || pricePerShare < 0)
    throw new Error("Per-share price must be ≥ 0.");
  if (!Number.isFinite(spotsTotal) || spotsTotal <= 0)
    throw new Error("Total spots must be > 0.");
  if (
    !Number.isFinite(spotsLeft) ||
    spotsLeft < 0 ||
    spotsLeft > spotsTotal
  )
    throw new Error("Spots left must be between 0 and total spots.");

  let images: string[] = [];
  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed))
      images = parsed.map((s) => String(s).trim()).filter(Boolean);
  } catch {
    images = [];
  }

  let itinerary: ItineraryDay[] = [];
  try {
    const parsed = JSON.parse(itineraryJson);
    if (Array.isArray(parsed)) {
      itinerary = parsed
        .map((d, i) => ({
          day: Number(d.day ?? i + 1),
          title: String(d.title ?? "").trim(),
          description: String(d.description ?? "").trim(),
        }))
        .filter((d) => d.title.length > 0);
    }
  } catch {
    itinerary = [];
  }

  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const includes = includesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    title,
    location,
    description,
    days,
    price_per_share: pricePerShare,
    start_date: startDate,
    spots_total: spotsTotal,
    spots_left: spotsLeft,
    images,
    itinerary,
    tags,
    includes,
  };
}

/** Create a new community trip. `intent='draft'` keeps it private to the
 *  host; `intent='submit'` flips status to `pending` and routes it into
 *  the admin approval queue. */
export async function createTrip(formData: FormData) {
  const { supabase, userId } = await requireAuth();
  const patch = readTripForm(formData);
  const intent = String(formData.get("intent") ?? "draft");
  const status: TripStatus = intent === "submit" ? "pending" : "draft";

  const { data, error } = await supabase
    .from("trips")
    .insert({
      ...patch,
      host_id: userId,
      status,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidateTripSurfaces(data?.id);
  if (status === "pending") {
    redirect(`/host/trips?submitted=${data!.id}`);
  }
  redirect(`/host/trips?draft=${data!.id}`);
}

/** Host updates their own trip. Allowed when status is draft or pending
 *  (pending = admin requested changes, host fixes and resubmits). Refused
 *  for live / completed / cancelled. */
export async function updateMyTrip(formData: FormData) {
  const { supabase, userId } = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trip id.");

  const intent = String(formData.get("intent") ?? "draft");
  const patch = readTripForm(formData);

  // Load current trip + verify ownership + status.
  const { data: existing, error: fetchErr } = await supabase
    .from("trips")
    .select("id, host_id, status")
    .eq("id", id)
    .single();
  if (fetchErr || !existing) throw new Error("Trip not found.");
  if (existing.host_id !== userId) {
    throw new Error("You don't own this trip.");
  }
  if (existing.status === "live" || existing.status === "completed") {
    throw new Error(
      "Live trips can't be edited here - cancel and create a new trip.",
    );
  }
  if (existing.status === "cancelled") {
    throw new Error("This trip has been cancelled.");
  }

  const fields: Record<string, unknown> = { ...patch };
  if (intent === "submit") {
    fields.status = "pending";
    fields.rejection_reason = null;
    fields.admin_notes = null;
  }

  const { error } = await supabase.from("trips").update(fields).eq("id", id);
  if (error) throw error;

  revalidateTripSurfaces(id);
  if (intent === "submit") {
    redirect(`/host/trips?submitted=${id}`);
  }
  redirect(`/host/trips/${id}?saved=1`);
}

/** Flip a draft into the admin queue. Refuses anything not currently draft. */
export async function submitMyDraft(formData: FormData) {
  const { supabase, userId } = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trip id.");

  const { data: existing } = await supabase
    .from("trips")
    .select("id, host_id, status")
    .eq("id", id)
    .single();
  if (!existing) throw new Error("Trip not found.");
  if (existing.host_id !== userId)
    throw new Error("You don't own this trip.");
  if (existing.status !== "draft") {
    throw new Error(
      `Only drafts can be submitted (current status: ${existing.status}).`,
    );
  }

  const { error } = await supabase
    .from("trips")
    .update({
      status: "pending",
      rejection_reason: null,
      admin_notes: null,
    })
    .eq("id", id);
  if (error) throw error;

  revalidateTripSurfaces(id);
  redirect(`/host/trips?submitted=${id}`);
}

/** Host cancels a single joiner's booking on their trip.
 *  Delegates to the host_cancel_booking RPC which atomically cancels the
 *  booking and restores the freed spot. Payment refunds are Epic 7. */
export async function cancelJoinerBooking(formData: FormData) {
  const { supabase } = await requireAuth();
  const bookingId = String(formData.get("booking_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!bookingId || !tripId) throw new Error("Missing required fields.");

  const { error } = await supabase.rpc("host_cancel_booking", {
    p_booking_id: bookingId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/host/trips/${tripId}/joiners`);
  revalidatePath(`/host/trips/${tripId}`);
  revalidatePath(`/trips/${tripId}`);
  redirect(`/host/trips/${tripId}/joiners?cancelled=1`);
}

/** Host-initiated cancellation. v1: flip status; payment refunds are
 *  Epic 7 territory. */
export async function cancelMyTrip(formData: FormData) {
  const { supabase, userId } = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trip id.");

  const { data: existing } = await supabase
    .from("trips")
    .select("id, host_id, status")
    .eq("id", id)
    .single();
  if (!existing) throw new Error("Trip not found.");
  if (existing.host_id !== userId)
    throw new Error("You don't own this trip.");
  if (existing.status === "cancelled") {
    throw new Error("This trip is already cancelled.");
  }

  const { error } = await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;

  revalidateTripSurfaces(id);
  redirect(`/host/trips/${id}?cancelled=1`);
}
