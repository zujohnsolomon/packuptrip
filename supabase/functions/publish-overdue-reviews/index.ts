/**
 * publish-overdue-reviews
 *
 * Edge Function invoked daily (configured in Supabase dashboard →
 * Edge Functions → Schedule). Calls the DB function that flips
 * is_visible = true on any review whose 14-day review_deadline has passed
 * but was never published by the mutual-review trigger.
 *
 * Schedule: every day at 02:00 UTC  →  cron: "0 2 * * *"
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Allow Supabase scheduler (no auth header) or a manual POST with the
  // service-role key for testing.
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    serviceKey,
  );

  const { error } = await supabase.rpc("publish_overdue_reviews");

  if (error) {
    console.error("publish_overdue_reviews failed:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("publish_overdue_reviews ran successfully");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
