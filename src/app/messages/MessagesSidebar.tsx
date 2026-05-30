"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ThreadSummary } from "@/types/db";

const AMBER = "#d97706";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MessagesSidebar({
  threads,
  currentUserId,
}: {
  threads: ThreadSummary[];
  currentUserId: string;
}) {
  const pathname = usePathname();
  const activeId =
    pathname.startsWith("/messages/") ? pathname.split("/")[2] ?? null : null;
  const onThread = !!activeId;

  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? threads.filter(
        (t) =>
          t.other_name.toLowerCase().includes(query) ||
          (t.last_body ?? "").toLowerCase().includes(query),
      )
    : threads;

  const totalUnread = threads.reduce((n, t) => n + t.unread_count, 0);

  return (
    <aside
      className={`${onThread ? "hidden md:flex" : "flex"} h-full w-full shrink-0 flex-col border-r border-stone-200/70 bg-white md:w-[340px] lg:w-[380px]`}
    >
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 pt-5">
        <Link
          href="/"
          aria-label="Back to Packuptrip"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-serif text-[26px] font-semibold leading-none text-[#17120f]">
          Messages
        </h1>
        {totalUnread > 0 && (
          <span
            className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold text-white"
            style={{ backgroundColor: AMBER }}
          >
            {totalUnread}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-2 pt-4">
        <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 focus-within:border-[#d97706] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d97706]/15">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-stone-400">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
            <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm text-ink placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-semibold text-stone-600">
              {threads.length === 0 ? "No messages yet" : "No matches"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone-400">
              {threads.length === 0
                ? "Book a community trip and message the host to start a conversation."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((t) => {
              const isActive = t.thread_id === activeId;
              const isUnread = t.unread_count > 0;
              const preview = t.last_body
                ? t.last_sender === currentUserId
                  ? `You: ${t.last_body}`
                  : t.last_body
                : "No messages yet";
              return (
                <li key={t.thread_id}>
                  <Link
                    href={`/messages/${t.thread_id}`}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                      isActive
                        ? "bg-[#fdf6ec] ring-1 ring-[#e9d4b3]"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      {t.other_avatar ? (
                        <Image
                          src={t.other_avatar}
                          alt={t.other_name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ece0cd] text-sm font-bold text-[#b45309] ring-2 ring-white">
                          {initialsOf(t.other_name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate text-[15px] ${
                            isUnread ? "font-bold text-[#17120f]" : "font-semibold text-stone-800"
                          }`}
                        >
                          {t.other_name}
                        </span>
                        <span className="shrink-0 text-[11px] text-stone-400">
                          {timeAgo(t.last_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-[13px] ${
                            isUnread ? "font-medium text-stone-700" : "text-stone-400"
                          }`}
                        >
                          {preview}
                        </span>
                        {isUnread && (
                          <span
                            className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: AMBER }}
                          >
                            {t.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
