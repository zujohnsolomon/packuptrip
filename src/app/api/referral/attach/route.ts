/**
 * POST /api/referral/attach?code=REF_CODE
 *
 * Called by the OAuth callback page to attach a referral code to a freshly
 * created Google (or other OAuth) account. Email sign-ups get the ref_code
 * via raw_user_meta_data at account creation time, but OAuth sign-ups don't —
 * so we do it here, right after the session is established.
 *
 * Idempotent: if referred_by is already set, returns { ok: true, skipped: true }.
 */

import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  if (!code) {
    return Response.json({ ok: false, error: "No code provided" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // Check if referred_by is already set (idempotent)
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  if (profile?.referred_by) {
    return Response.json({ ok: true, skipped: true });
  }

  // Find the referrer — must exist and must not be the user themselves
  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .neq("id", user.id)
    .single();

  if (!referrer) {
    return Response.json({ ok: false, error: "Invalid referral code" }, { status: 400 });
  }

  // Set referred_by atomically
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  if (updateErr) {
    return Response.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  // Upsert audit row in referrals table (same as the track_referral_signup trigger does)
  await supabase
    .from("referrals")
    .upsert(
      { referrer_id: referrer.id, referred_id: user.id, credit_amount: 200 },
      { onConflict: "referred_id", ignoreDuplicates: true },
    );

  return Response.json({ ok: true });
}
