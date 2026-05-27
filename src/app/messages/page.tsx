import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getMyThreads } from "@/lib/supabase/queries";
import type { ThreadSummary } from "@/types/db";

export const metadata = { title: "Messages · Packuptrip" };

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function ThreadRow({ thread, userId }: { thread: ThreadSummary; userId: string }) {
  const initials = thread.other_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isUnread = thread.unread_count > 0;
  const preview = thread.last_body
    ? thread.last_sender === userId
      ? `You: ${thread.last_body}`
      : thread.last_body
    : "No messages yet";

  return (
    <Link
      href={`/messages/${thread.thread_id}`}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:p-5"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {thread.other_avatar ? (
          <Image
            src={thread.other_avatar}
            alt={thread.other_name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
            {initials}
          </div>
        )}
        {isUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm ${isUnread ? "font-semibold text-ink" : "font-medium text-stone-700"}`}>
            {thread.other_name}
          </span>
          <span className="shrink-0 text-[11px] text-stone-400">
            {timeAgo(thread.last_at)}
          </span>
        </div>
        {thread.trip_title && (
          <div className="mt-0.5 truncate text-[11px] font-medium text-green-700">
            {thread.trip_title}
          </div>
        )}
        <p className={`mt-0.5 truncate text-xs ${isUnread ? "text-stone-700" : "text-stone-400"}`}>
          {preview.length > 80 ? preview.slice(0, 80) + "…" : preview}
        </p>
      </div>
    </Link>
  );
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ hostId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/messages");

  // ?hostId= from "Message host" CTA on /hosts/[id] — open/create thread immediately
  const { hostId } = await searchParams;
  if (hostId && hostId !== user.id) {
    const { getOrCreateThread } = await import("@/lib/supabase/queries");
    const threadId = await getOrCreateThread(hostId, null);
    redirect(`/messages/${threadId}`);
  }

  const threads = await getMyThreads();

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Messages
            </h1>
            {threads.length > 0 && (
              <p className="mt-1 text-stone-500">
                {threads.reduce((n, t) => n + t.unread_count, 0) > 0
                  ? `${threads.reduce((n, t) => n + t.unread_count, 0)} unread`
                  : "All caught up"}
              </p>
            )}
          </div>

          {threads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60 p-12 text-center">
              <div className="text-4xl">✉️</div>
              <p className="mt-4 font-medium text-ink">No messages yet</p>
              <p className="mt-1 text-sm text-stone-500">
                Book a community trip and message the host from your booking page.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((t) => (
                <ThreadRow key={t.thread_id} thread={t} userId={user.id} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
