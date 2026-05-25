"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IdType, VerificationRequest } from "@/types/db";

/** Upsert a verification request after files are uploaded client-side. */
export async function submitVerification(payload: {
  idType: IdType;
  idDocPath: string;
  selfiePath: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("id_verification_requests")
    .upsert(
      {
        user_id: user.id,
        id_type: payload.idType,
        id_doc_path: payload.idDocPath,
        selfie_path: payload.selfiePath,
        status: "pending",
        admin_notes: null,
        reviewed_at: null,
        reviewed_by: null,
      },
      { onConflict: "user_id" }
    );

  if (error) { console.error("submitVerification:", error); return { error: error.message }; }
  revalidatePath("/account/verify");
  return { error: null };
}

/** Admin: approve a request → flip id_verified on profile. */
export async function approveVerification(
  requestId: string,
  userId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Update request
  const { error: reqErr } = await supabase
    .from("id_verification_requests")
    .update({
      status: "approved",
      admin_notes: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);
  if (reqErr) return { error: reqErr.message };

  // Flip id_verified on profile
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ id_verified: true })
    .eq("id", userId);
  if (profileErr) return { error: profileErr.message };

  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${requestId}`);
  return { error: null };
}

/** Admin: reject with a reason. */
export async function rejectVerification(
  requestId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("id_verification_requests")
    .update({
      status: "rejected",
      admin_notes: reason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/admin/verifications");
  revalidatePath(`/admin/verifications/${requestId}`);
  return { error: null };
}

/** Get the signed URL for an ID document or selfie (admin only, 1-hour TTL). */
export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("id-documents")
    .createSignedUrl(path, 3600);
  if (error) { console.error("getSignedUrl:", error); return null; }
  return data.signedUrl;
}

/** Fetch current user's own verification request. */
export async function getMyVerificationRequest(): Promise<VerificationRequest | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("id_verification_requests")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<VerificationRequest>();
  return data ?? null;
}

/** Admin: count pending verification requests. */
export async function getPendingVerificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("id_verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/** Admin: list all verification requests, pending first. */
export async function listVerificationRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("id_verification_requests")
    .select("*, profile:profiles(id,name,email,avatar_url,id_verified)")
    .order("status") // pending sorts before approved/rejected alphabetically (a < p < r actually — use case below)
    .order("created_at", { ascending: true });
  if (error) { console.error("listVerificationRequests:", error); return []; }
  // Sort: pending first
  return (data ?? []).sort((a: any, b: any) => {
    const order = { pending: 0, approved: 1, rejected: 2 };
    return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9);
  });
}

/** Admin: single request with profile. */
export async function getVerificationRequest(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("id_verification_requests")
    .select("*, profile:profiles(id,name,email,avatar_url,id_verified)")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}
