"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/db";

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
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-stone-100" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-stone-100" />
    </div>
  );
}

function Bubble({
  msg,
  isOwn,
  isFirst,
  isLast,
  otherInitials,
  otherAvatar,
}: {
  msg: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  otherInitials: string;
  otherAvatar: string | null;
}) {
  const isOptimistic = msg.id.startsWith("opt-");

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar placeholder — keeps alignment for grouped messages */}
      <div className="w-8 shrink-0">
        {!isOwn && isLast && (
          otherAvatar ? (
            <Image
              src={otherAvatar}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-800">
              {otherInitials}
            </div>
          )
        )}
      </div>

      <div className={`flex max-w-[72%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed transition-opacity ${
            isOwn
              ? `bg-amber-500 text-white ${
                  isFirst ? "rounded-t-2xl" : "rounded-t-lg"
                } ${isLast ? "rounded-bl-2xl rounded-br-sm" : "rounded-b-lg"}`
              : `bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-stone-800 ${
                  isFirst ? "rounded-t-2xl" : "rounded-t-lg"
                } ${isLast ? "rounded-br-2xl rounded-bl-sm" : "rounded-b-lg"}`
          } ${isOptimistic ? "opacity-70" : "opacity-100"}`}
        >
          {msg.body}
        </div>
        {isLast && (
          <span className="mt-1 text-[10px] text-stone-400">
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
  sendAction,
}: {
  threadId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherUser: { id: string; name: string; avatar_url: string | null } | null;
  trip: { id: string; title: string; images: string[] } | null;
  sendAction: (body: string) => Promise<Message | null>;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const otherInitials = (otherUser?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Initial scroll — instant
  useEffect(() => { scrollToBottom(false); }, []);

  // Scroll when new messages arrive
  useEffect(() => { scrollToBottom(true); }, [messages.length]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          // Skip own messages — already shown optimistically
          if (incoming.sender_id === currentUserId) {
            // Replace optimistic copy with the real one
            setMessages((prev) =>
              prev.map((m) =>
                m.id.startsWith("opt-") && m.body === incoming.body && m.sender_id === currentUserId
                  ? incoming
                  : m
              )
            );
            return;
          }
          setMessages((prev) => [...prev, incoming]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      // Replace the optimistic bubble with the real DB row so "Sending…" clears.
      // If Realtime also fires, it won't find an opt- message and will no-op.
      setMessages((prev) =>
        prev.map((m) => (m.id === optId ? (saved ?? { ...m, id: `sent-${Date.now()}` }) : m))
      );
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
        otherInitials={otherInitials}
        otherAvatar={otherUser?.avatar_url ?? null}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-white">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <Link
          href="/messages"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
          aria-label="Back to inbox"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Other user avatar */}
        {otherUser?.avatar_url ? (
          <Image
            src={otherUser.avatar_url}
            alt={otherUser.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
            {otherInitials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {otherUser?.name ?? "Unknown"}
          </p>
          {trip && (
            <Link
              href={`/trips/${trip.id}`}
              className="truncate text-[11px] text-teal-600 hover:underline"
            >
              {trip.title}
            </Link>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-5xl">👋</div>
              <p className="mt-3 font-medium text-ink">Say hello!</p>
              <p className="mt-1 text-sm text-stone-500">
                This is the start of your conversation with {otherUser?.name?.split(" ")[0] ?? "them"}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {rendered}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="border-t border-stone-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-40"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7L8 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-stone-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
