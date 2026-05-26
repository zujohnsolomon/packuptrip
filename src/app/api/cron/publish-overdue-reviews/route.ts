import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Vercel Cron Job — runs daily at 02:00 UTC.
 * Publishes any review that is still hidden after its 14-day review_deadline.
 * Secured by CRON_SECRET env var (set in Vercel dashboard).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  // Vercel attaches Authorization: Bearer <CRON_SECRET> on every cron call.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_overdue_reviews");

  if (error) {
    console.error("[cron] publish_overdue_reviews failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log("[cron] publish_overdue_reviews ran successfully");
  return NextResponse.json({ ok: true });
}
