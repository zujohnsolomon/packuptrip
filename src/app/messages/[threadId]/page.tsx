import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getThreadWithParticipants,
  getThreadMessages,
  markThreadRead,
} from "@/lib/supabase/queries";
import { ChatClient } from "./ChatClient";
import { sendMessage, blockUser, unblockUser } from "@/actions/messages";

export const metadata = { title: "Chat · Packuptrip" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/messages/${threadId}`);

  const [thread, messages] = await Promise.all([
    getThreadWithParticipants(threadId),
    getThreadMessages(threadId),
  ]);

  if (!thread) notFound();

  // Must be a participant
  if (thread.participant_a !== user.id && thread.participant_b !== user.id) {
    notFound();
  }

  // Mark incoming messages as read
  await markThreadRead(threadId);

  // Resolve the "other" participant
  const otherProfile =
    thread.participant_a === user.id
      ? (thread as any).participant_b_profile
      : (thread as any).participant_a_profile;

  const trip = (thread as any).trip ?? null;

  // Check if current user has blocked the other participant
  const { data: blockRow } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherProfile?.id ?? "")
    .maybeSingle();
  const isBlockedByMe = !!blockRow;

  async function handleSend(body: string) {
    "use server";
    return sendMessage(threadId, body);
  }
  async function handleBlock() {
    "use server";
    await blockUser(otherProfile?.id ?? "");
  }
  async function handleUnblock() {
    "use server";
    await unblockUser(otherProfile?.id ?? "");
  }

  return (
    <ChatClient
      threadId={threadId}
      currentUserId={user.id}
      initialMessages={messages}
      otherUser={otherProfile}
      trip={trip}
      initialIsBlocked={isBlockedByMe}
      sendAction={handleSend}
      blockAction={handleBlock}
      unblockAction={handleUnblock}
    />
  );
}
