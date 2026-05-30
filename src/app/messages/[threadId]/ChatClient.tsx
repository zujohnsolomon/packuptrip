"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/db";

// ─── palette ─────────────────────────────────────────────────────────────────
const PAPER = "#f1e9da"; // warm parchment background
const AMBER = "#d97706"; // own message bubbles / accents

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function isSameGroup(a: Message, b: Message) {
  return a.sender_id === b.sender_id &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60_000;
}

// ─── components ──────────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-5">
      <span className="rounded-full bg-white/70 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 shadow-[0_2px_10px_rgba(64,44,26,0.06)] ring-1 ring-stone-200/60 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

function Bubble({
  msg,
  isOwn,
  isFirst,
  isLast,
  otherId,
  otherInitials,
  otherAvatar,
}: {
  msg: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  otherId: string;
  otherInitials: string;
  otherAvatar: string | null;
}) {
  const isOptimistic = msg.id.startsWith("opt-");

  return (
    <div className={`flex items-end gap-2.5 ${isFirst ? "mt-3" : "mt-0.5"} ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — only under the last bubble of an incoming group */}
      <div className="w-8 shrink-0">
        {!isOwn && isLast && (
          <Link href={`/hosts/${otherId}`} className="block">
            {otherAvatar ? (
              <Image
                src={otherAvatar}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-white transition-opacity hover:opacity-80"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ece0cd] text-[11px] font-bold text-[#b45309] ring-2 ring-white transition-opacity hover:opacity-80">
                {otherInitials}
              </div>
            )}
          </Link>
        )}
      </div>

      <div className={`flex max-w-[74%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 text-[14px] leading-relaxed transition-opacity ${
            isOwn
              ? `rounded-[20px] text-white ${isLast ? "rounded-br-md" : ""}`
              : `rounded-[20px] bg-white text-stone-800 ring-1 ring-stone-200/70 shadow-[0_2px_12px_rgba(64,44,26,0.06)] ${isLast ? "rounded-bl-md" : ""}`
          } ${isOptimistic ? "opacity-70" : "opacity-100"}`}
          style={isOwn ? { backgroundColor: AMBER } : undefined}
        >
          {msg.body}
        </div>
        {isLast && (
          <span className="mt-1 px-1 text-[10px] font-medium text-stone-400">
            {isOptimistic ? "Sending…" : formatTime(msg.created_at)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function ChatClient({
  threadId,
  currentUserId,
  initialMessages,
  otherUser,
  trip,
  initialIsBlocked,
  sendAction,
  blockAction,
  unblockAction,
}: {
  threadId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherUser: { id: string; name: string; avatar_url: string | null } | null;
  trip: { id: string; title: string; images: string[] } | null;
  initialIsBlocked: boolean;
  sendAction: (body: string) => Promise<Message | null>;
  blockAction: () => Promise<void>;
  unblockAction: () => Promise<void>;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const otherInitials = (otherUser?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const firstName = otherUser?.name?.split(" ")[0] ?? "them";

  async function handleBlock() {
    setBlockBusy(true);
    await blockAction();
    setIsBlocked(true);
    setConfirmBlock(false);
    setMenuOpen(false);
    setBlockBusy(false);
  }

  async function handleUnblock() {
    setBlockBusy(true);
    await unblockAction();
    setIsBlocked(false);
    setMenuOpen(false);
    setBlockBusy(false);
  }

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Initial scroll — instant
  useEffect(() => { scrollToBottom(false); }, []);

  // Scroll when new messages arrive
  useEffect(() => { scrollToBottom(true); }, [messages.length]);

  // Supabase Realtime — broadcast channel (same approach as group chat).
  // postgres_changes with row-level filters is unreliable; broadcast is instant.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm-${threadId}`)
      .on(
        "broadcast",
        { event: "new_message" },
        ({ payload }: { payload: { message: Message } }) => {
          const incoming = payload.message;
          if (incoming.sender_id === currentUserId) {
            // Safety net: replace any still-pending opt- bubble
            setMessages((prev) =>
              prev.map((m) =>
                m.id.startsWith("opt-") && m.body === incoming.body ? incoming : m
              )
            );
          } else {
            // Other person's message — guard against duplicates
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [threadId, currentUserId]);

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Add optimistic bubble immediately
    const optId = `opt-${Date.now()}`;
    const optimistic: Message = {
      id: optId,
      thread_id: threadId,
      sender_id: currentUserId,
      body: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setSending(true);
    try {
      const saved = await sendAction(text);
      const realMessage = saved ?? { ...optimistic, id: `sent-${Date.now()}` };

      // Replace the optimistic bubble with the real DB row
      setMessages((prev) =>
        prev.map((m) => (m.id === optId ? realMessage : m))
      );

      // Broadcast so the other participant receives it instantly (no DB polling)
      channelRef.current?.send({
        type: "broadcast",
        event: "new_message",
        payload: { message: realMessage },
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Render message list with date separators and grouping
  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    // Date separator
    if (!prev || !isSameDay(prev.created_at, msg.created_at)) {
      rendered.push(
        <DateSeparator key={`sep-${msg.id}`} label={formatDateLabel(msg.created_at)} />
      );
    }

    const isOwn = msg.sender_id === currentUserId;
    const isFirst = !prev || !isSameGroup(prev, msg);
    const isLast = !next || !isSameGroup(msg, next);

    rendered.push(
      <Bubble
        key={msg.id}
        msg={msg}
        isOwn={isOwn}
        isFirst={isFirst}
        isLast={isLast}
        otherId={otherUser?.id ?? ""}
        otherInitials={otherInitials}
        otherAvatar={otherUser?.avatar_url ?? null}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col" style={{ backgroundColor: PAPER }}>
      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 border-b border-stone-200/70 px-4 py-3 backdrop-blur-md"
        style={{ backgroundColor: "rgba(241,233,218,0.85)" }}
      >
        <Link
          href="/messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-white/70"
          aria-label="Back to inbox"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Other user avatar — taps to profile */}
        <Link href={`/hosts/${otherUser?.id}`} className="shrink-0">
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.name}
              width={42}
              height={42}
              className="h-[42px] w-[42px] rounded-full object-cover shadow-sm ring-2 ring-white transition-opacity hover:opacity-80"
            />
          ) : (
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#ece0cd] text-sm font-bold text-[#b45309] ring-2 ring-white transition-opacity hover:opacity-80">
              {otherInitials}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/hosts/${otherUser?.id}`}
            className="block truncate font-serif text-[18px] font-semibold leading-tight text-[#17120f] transition-colors hover:text-[#b45309]"
          >
            {otherUser?.name ?? "Unknown"}
          </Link>
          {trip ? (
            <Link
              href={`/trips/${trip.id}`}
              className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-semibold text-[#2d5130] hover:underline"
            >
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d5130]" />
              <span className="truncate">{trip.title}</span>
            </Link>
          ) : (
            <span className="text-[11px] text-stone-400">Direct message</span>
          )}
        </div>

        {/* ⋮ overflow menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition hover:bg-white/70"
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <circle cx="9" cy="3.5" r="1.5" />
              <circle cx="9" cy="9" r="1.5" />
              <circle cx="9" cy="14.5" r="1.5" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-xl">
              {/* View profile */}
              <Link
                href={`/hosts/${otherUser?.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="5" r="3" />
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" />
                </svg>
                View profile
              </Link>

              {/* View trip — only if thread is tied to one */}
              {trip && (
                <Link
                  href={`/trips/${trip.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2L3 6v8h4v-4h2v4h4V6L8 2z" />
                  </svg>
                  View trip
                </Link>
              )}

              <div className="h-px bg-stone-100" />

              {/* Block / Unblock */}
              {isBlocked ? (
                <button
                  onClick={handleUnblock}
                  disabled={blockBusy}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="6" />
                    <line x1="4" y1="4" x2="12" y2="12" />
                  </svg>
                  {blockBusy ? "Unblocking…" : `Unblock ${firstName}`}
                </button>
              ) : confirmBlock ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-stone-500">
                    Block {firstName}? They won&apos;t be able to message you.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleBlock}
                      disabled={blockBusy}
                      className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {blockBusy ? "Blocking…" : "Block"}
                    </button>
                    <button
                      onClick={() => setConfirmBlock(false)}
                      className="flex-1 rounded-lg bg-stone-100 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmBlock(true)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="6" />
                    <line x1="4" y1="4" x2="12" y2="12" />
                  </svg>
                  Block {firstName}
                </button>
              )}

              {!isBlocked && !confirmBlock && <div className="h-px bg-stone-100" />}

              {/* Report */}
              {!confirmBlock && (
                <Link
                  href={`/report?type=user&id=${otherUser?.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2L2 13h12L8 2z" />
                    <line x1="8" y1="7" x2="8" y2="10" />
                    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
                  </svg>
                  Report {firstName}
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="max-w-xs text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_12px_30px_rgba(217,119,6,0.3)]"
                  style={{ backgroundColor: AMBER }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
                  </svg>
                </div>
                <h2 className="mt-5 font-serif text-2xl font-semibold text-[#17120f]">
                  Say hello to {firstName}.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  This is the beginning of your conversation. Break the ice — ask about the trip, the dates, or the plan.
                </p>
              </div>
            </div>
          ) : (
            <div className="pb-2">{rendered}</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar / Blocked state ── */}
      {isBlocked ? (
        <div className="border-t border-stone-200/70 px-4 py-5 text-center" style={{ backgroundColor: "rgba(241,233,218,0.9)" }}>
          <p className="text-sm font-semibold text-stone-600">
            You have blocked {firstName}
          </p>
          <button
            onClick={handleUnblock}
            disabled={blockBusy}
            className="mt-2 text-xs font-bold text-[#b45309] hover:text-[#92400e] disabled:opacity-50"
          >
            {blockBusy ? "Unblocking…" : "Unblock"}
          </button>
        </div>
      ) : (
        <div
          className="border-t border-stone-200/70 px-4 py-3.5 backdrop-blur-md sm:px-8"
          style={{ backgroundColor: "rgba(241,233,218,0.9)" }}
        >
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2.5">
            <div className="flex flex-1 items-end rounded-[24px] border border-stone-200 bg-white px-2 py-1 shadow-[0_2px_12px_rgba(64,44,26,0.06)] focus-within:border-[#d97706] focus-within:ring-2 focus-within:ring-[#d97706]/15">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Write a message…"
                className="flex-1 resize-none bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-stone-400 focus:outline-none"
                style={{ maxHeight: 120 }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(217,119,6,0.35)] transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
              style={{ backgroundColor: AMBER }}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-stone-400">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
