"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportCategory, SubjectType } from "@/types/db";

const ALLOWED_CATEGORIES: ReportCategory[] = [
  "safety",
  "harassment",
  "fraud",
  "other",
];
const ALLOWED_SUBJECT_TYPES: SubjectType[] = ["user", "trip", "package"];

/** Public action: anyone signed in can file a report. The RLS policy
 *  `reports_signed_in_insert` ensures `reporter_id = auth.uid()`. */
export async function fileReport(formData: FormData) {
  const subjectType = String(formData.get("subject_type") ?? "") as SubjectType;
  const subjectId = String(formData.get("subject_id") ?? "");
  const bookingId = String(formData.get("booking_id") ?? "");
  const category = String(formData.get("category") ?? "") as ReportCategory;
  const description = String(formData.get("description") ?? "").trim();

  if (!ALLOWED_SUBJECT_TYPES.includes(subjectType)) {
    throw new Error("Invalid subject type.");
  }
  if (!subjectId) throw new Error("Missing subject.");
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error("Pick a category.");
  }
  if (description.length < 4) {
    throw new Error("Please describe the issue in a sentence or two.");
  }
  if (description.length > 4000) {
    throw new Error("Description is too long (max 4000 characters).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to file a report.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    subject_type: subjectType,
    subject_id: subjectId,
    booking_id: bookingId || null,
    category,
    description,
  });
  if (error) throw error;

  // Bust the admin queue cache + the sidebar count so admins see it instantly.
  revalidatePath("/admin/reports");
  revalidatePath("/admin/overview");
  revalidatePath("/admin", "layout");

  redirect("/report/sent");
}
