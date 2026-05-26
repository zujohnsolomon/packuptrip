"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateThread } from "@/lib/supabase/queries";
import type { Message } from "@/types/db";

/** Called from the booking page — opens (or finds) a thread and redirects. */
export async function openThread(formData: FormData) {
  const hostId = String(formData.get("hostId"));
  const tripId = formData.get("tripId") as string | null;

  const threadId = await getOrCreateThread(hostId, tripId);
  if (!threadId) redirect("/account");
  redirect(`/messages/${threadId}`);
}

/** Send a message and return the inserted row so the caller can replace
 *  its optimistic copy immediately — no Realtime round-trip needed. */
export async function sendMessage(
  threadId: string,
  body: string,
): Promise<Message | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !body.trim()) return null;

  const { data } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender_id: user.id, body: body.trim() })
    .select()
    .single();

  return (data as Message) ?? null;
}
