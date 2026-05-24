"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Throws if the current user isn't an admin. Wraps every action. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in.");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required.");
  }
  return { supabase, userId: user.id };
}

function revalidateApprovalSurfaces() {
  // Anywhere a trip's status affects the UI.
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/overview");
  revalidatePath("/trips");
  revalidatePath("/search");
}

/** Mark a pending trip as live. */
export async function approveTrip(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trip id.");

  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("trips")
    .update({
      status: "live",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      rejection_reason: null,
      admin_notes: null,
    })
    .eq("id", id);
  if (error) throw error;

  revalidateApprovalSurfaces();
  redirect(`/admin/approvals?approved=${id}`);
}

/** Reject a pending trip - sets status back to draft so the host can fix
 *  and resubmit. Reason is shown to the host. */
export async function rejectTrip(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) throw new Error("Missing trip id.");
  if (reason.length < 4) throw new Error("Please provide a rejection reason.");

  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("trips")
    .update({
      status: "draft",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      rejection_reason: reason,
      admin_notes: null,
    })
    .eq("id", id);
  if (error) throw error;

  revalidateApprovalSurfaces();
  redirect(`/admin/approvals?rejected=${id}`);
}

/** Trip stays pending; admin_notes go to the host. Host edits and the trip
 *  comes back through the queue. */
export async function requestTripChanges(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) throw new Error("Missing trip id.");
  if (notes.length < 4) throw new Error("Tell the host what to change.");

  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("trips")
    .update({
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", id);
  if (error) throw error;

  revalidateApprovalSurfaces();
  redirect(`/admin/approvals?notes=${id}`);
}

/** Update editable fields. If `publish` is "1", also flip status → live in
 *  the same write. */
export async function saveTripEdits(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing trip id.");

  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const includesRaw = String(formData.get("includes") ?? "");
  const tagsRaw = String(formData.get("tags") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";

  if (title.length < 3) throw new Error("Title is too short.");
  if (location.length < 2) throw new Error("Location is required.");

  const includes = includesRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { supabase, userId } = await requireAdmin();

  const patch: Record<string, unknown> = {
    title,
    location,
    description,
    includes,
    tags,
  };
  if (publish) {
    patch.status = "live";
    patch.reviewed_at = new Date().toISOString();
    patch.reviewed_by = userId;
    patch.rejection_reason = null;
    patch.admin_notes = null;
  }

  const { error } = await supabase.from("trips").update(patch).eq("id", id);
  if (error) throw error;

  revalidateApprovalSurfaces();
  if (publish) {
    redirect(`/admin/approvals?approved=${id}`);
  }
  redirect(`/admin/approvals/${id}?saved=1`);
}
