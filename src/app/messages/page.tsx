import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages · Packuptrip" };

const AMBER = "#d97706";

export default async function MessagesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ hostId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/messages");

  // ?hostId= from a "Message host" CTA — open/create the thread immediately.
  const { hostId } = await searchParams;
  if (hostId && hostId !== user.id) {
    const { getOrCreateThread } = await import("@/lib/supabase/queries");
    const threadId = await getOrCreateThread(hostId, null);
    redirect(`/messages/${threadId}`);
  }

  // Desktop: empty-state in the right pane. Mobile: hidden, so the sidebar list
  // fills the screen (the layout renders the list to the left of this).
  return (
    <div className="hidden h-full flex-1 flex-col items-center justify-center p-10 text-center md:flex">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(217,119,6,0.3)]"
        style={{ backgroundColor: AMBER }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
        </svg>
      </div>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-[#17120f]">
        Your conversations
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
        Pick a conversation from the left to read and reply. New messages from
        travellers and hosts land here.
      </p>
    </div>
  );
}
