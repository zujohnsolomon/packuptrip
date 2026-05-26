import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getThreadWithParticipants,
  getThreadMessages,
  markThreadRead,
} from "@/lib/supabase/queries";
import { ChatClient } from "./ChatClient";
import { sendMessage } from "@/actions/messages";

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

  // Server action bound to this thread — returns the real row so ChatClient
  // can replace its optimistic copy without waiting for a Realtime event.
  async function handleSend(body: string) {
    "use server";
    return sendMessage(threadId, body);
  }

  return (
    <ChatClient
      threadId={threadId}
      currentUserId={user.id}
      initialMessages={messages}
      otherUser={otherProfile}
      trip={trip}
      sendAction={handleSend}
    />
  );
}
