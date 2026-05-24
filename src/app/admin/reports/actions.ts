"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/types/db";

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
  return { supabase, callerId: user.id };
}

function revalidateReportSurfaces(reportId?: string) {
  revalidatePath("/admin/reports");
  revalidatePath("/admin/overview");
  revalidatePath("/admin", "layout");
  if (reportId) revalidatePath(`/admin/reports/${reportId}`);
}

/** Move a report through the workflow: open → investigating → resolved.
 *  Records reviewer + timestamp on resolution. */
export async function setReportStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReportStatus;
  if (!id) throw new Error("Missing report id.");
  if (!["open", "investigating", "resolved"].includes(status)) {
    throw new Error("Invalid status.");
  }
  const { supabase, callerId } = await requireAdmin();

  const patch: Record<string, unknown> = { status };
  if (status === "resolved") {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = callerId;
  } else {
    patch.resolved_at = null;
    patch.resolved_by = null;
  }

  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw error;

  revalidateReportSurfaces(id);
  redirect(`/admin/reports/${id}?status=${status}`);
}

/** Append admin notes. Overwrites the field (single text blob); v1 keeps
 *  it simple. A future audit log can split into multiple entries. */
export async function saveAdminNotes(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) throw new Error("Missing report id.");

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("reports")
    .update({ admin_notes: notes.length === 0 ? null : notes })
    .eq("id", id);
  if (error) throw error;

  revalidateReportSurfaces(id);
  redirect(`/admin/reports/${id}?notes=1`);
}
