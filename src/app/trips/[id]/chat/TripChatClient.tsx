"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendTripMessage, deleteTripMessage, removeTripMember } from "@/actions/tripChat";
import type { TripMessage } from "@/types/db";
import type { TripMember } from "@/actions/tripChat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isSameGroup(a: TripMessage, b: TripMessage) {
  return (
    a.sender_id === b.sender_id &&
    Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < 5 * 60_000
  );
}

// ─── Host action menu ─────────────────────────────────────────────────────────

type HostMenuProps = {
  tripId: string;
  message: TripMessage;
  senderName: string;
  senderId: string;
  isOwnMessage: boolean;
  onDeleted: (messageId: string) => void;
  onRemoved: (memberId: string) => void;
};

function HostMenu({ tripId, message, senderName, senderId, isOwnMessage, onDeleted, onRemoved }: HostMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleDelete() {
    setBusy(true);
    setOpen(false);
    await deleteTripMessage(message.id);
    onDeleted(message.id);
    setBusy(false);
  }

  async function handleRemove() {
    if (!confirm(`Remove ${senderName} from this trip? Their booking will be cancelled.`)) return;
    setBusy(true);
    setOpen(false);
    await removeTripMember(tripId, senderId);
    onRemoved(senderId);
    setBusy(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 opacity-0 transition-opacity group-hover/msg:opacity-100 hover:bg-stone-100 hover:text-stone-600"
        aria-label="Message actions"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.2"/><circle cx="8" cy="8" r="1.2"/><circle cx="8" cy="13" r="1.2"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-48 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 right-0">
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"/>
            </svg>
            Delete message
          </button>

          {!isOwnMessage && (
            <>
              <a
                href={`/report?type=user&id=${senderId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z"/>
                  <path d="M8 5.5v3M8 10.5v.5" strokeLinecap="round"/>
                </svg>
                Report user
              </a>
              <div className="mx-3 border-t border-stone-100" />
              <button
                onClick={handleRemove}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 8H5M13 4l-2-2H5L3 4v8l2 2h6l2-2V4z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Remove from trip
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  member,
  size = 8,
}: {
  member: TripMember;
  size?: number;
}) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const px = size * 4;
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-amber-100`}
      style={{ width: px, height: px }}
    >
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-amber-700"
          style={{ fontSize: px * 0.35 }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TripChatClient({
  tripId,
  tripTitle,
  currentUserId,
  isHost,
  initialMessages,
  members,
}: {
  tripId: string;
  tripTitle: string;
  currentUserId: string;
  isHost: boolean;
  initialMessages: TripMessage[];
  members: TripMember[];
}) {
  const [messages, setMessages] = useState<TripMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const me = memberMap.get(currentUserId);

  // ── Realtime via broadcast (no RLS/JWT dependency) ──────────────────────────
  // We keep a stable channel ref so handleSend can broadcast on it
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        "broadcast",
        { event: "new_message" },
        ({ payload }: { payload: { message: TripMessage } }) => {
          const incoming = payload.message;
          if (incoming.sender_id === currentUserId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id.startsWith("opt-") && m.body === incoming.body ? incoming : m
              )
            );
          } else {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        }
      )
      .on(
        "broadcast",
        { event: "delete_message" },
        ({ payload }: { payload: { messageId: string } }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.messageId
                ? { ...m, deleted_at: new Date().toISOString() }
                : m
            )
          );
        }
      )
      .on(
        "broadcast",
        { event: "remove_member" },
        ({ payload }: { payload: { memberId: string } }) => {
          // If you were removed, boot you out (parent page will redirect)
          if (payload.memberId === currentUserId) {
            window.location.href = "/trips";
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [tripId, currentUserId]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length <= initialMessages.length ? "instant" : "smooth" });
  }, [messages.length]);

  // ── Send ────────────────────────────────────────────────────────────────────
  async function handleSend() {
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setInput("");

    // Optimistic
    const opt: TripMessage = {
      id: `opt-${Date.now()}`,
      trip_id: tripId,
      sender_id: currentUserId,
      body,
      created_at: new Date().toISOString(),
      deleted_at: null,
    };
    setMessages((prev) => [...prev, opt]);

    startTransition(async () => {
      const { message, error } = await sendTripMessage(tripId, body);
      setSending(false);

      if (error || !message) {
        // Roll back optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.body !== body || !m.id.startsWith("opt-")));
        return;
      }

      // Replace our optimistic copy with the real saved row
      setMessages((prev) =>
        prev.map((m) => (m.id.startsWith("opt-") && m.body === body ? message : m))
      );

      // Broadcast to all other members via Realtime channel
      channelRef.current?.send({
        type: "broadcast",
        event: "new_message",
        payload: { message },
      });
    });
  }

  // ── Host: message deleted ────────────────────────────────────────────────────
  function handleDeleted(messageId: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
      )
    );
    channelRef.current?.send({
      type: "broadcast",
      event: "delete_message",
      payload: { messageId },
    });
  }

  // ── Host: member removed ─────────────────────────────────────────────────────
  function handleRemoved(memberId: string) {
    channelRef.current?.send({
      type: "broadcast",
      event: "remove_member",
      payload: { memberId },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      {/* Members strip */}
      <div className="flex items-center gap-2 border-b border-stone-100 bg-white px-4 py-3">
        <div className="flex -space-x-2">
          {members.slice(0, 6).map((m) => (
            <div key={m.id} className="ring-2 ring-white rounded-full">
              <Avatar member={m} size={7} />
            </div>
          ))}
          {members.length > 6 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500 ring-2 ring-white">
              +{members.length - 6}
            </div>
          )}
        </div>
        <span className="text-xs text-stone-500">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex flex-wrap gap-1">
          {members.filter(m => m.is_host).map(m => (
            <span key={m.id} className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
              {m.name.split(" ")[0]} · Host
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="text-4xl">🎒</div>
            <p className="text-sm font-semibold text-stone-500">
              This is the beginning of your trip chat
            </p>
            <p className="text-xs text-stone-400 max-w-xs">
              Say hello to your fellow travellers. Use this space to coordinate,
              share excitement, and ask questions.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const sender = memberMap.get(msg.sender_id);
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at);
          const isFirstInGroup = !prev || !isSameGroup(prev, msg);
          const isLastInGroup = !next || !isSameGroup(msg, next);
          const isOptimistic = msg.id.startsWith("opt-");

          return (
            <div key={msg.id}>
              {/* Date separator */}
              {showDateSep && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stone-100" />
                  <span className="text-[11px] font-medium text-stone-400">
                    {formatDateLabel(msg.created_at)}
                  </span>
                  <div className="h-px flex-1 bg-stone-100" />
                </div>
              )}

              <div className={`group/msg flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                {/* Avatar — only shown for last in group, others side is blank space */}
                <div className="w-8 shrink-0">
                  {!isMe && isLastInGroup && sender && (
                    <Avatar member={sender} size={8} />
                  )}
                </div>

                <div className={`flex max-w-[72%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender name — only first in group, not for me */}
                  {!isMe && isFirstInGroup && sender && (
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span className="text-[11px] font-semibold text-stone-600">
                        {sender.name}
                      </span>
                      {sender.is_host && (
                        <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold text-teal-700">
                          Host
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  {msg.deleted_at ? (
                    <div className="rounded-2xl px-3.5 py-2 text-sm italic text-stone-400 ring-1 ring-stone-100">
                      Message deleted
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        isMe
                          ? `bg-amber-500 text-white ${isOptimistic ? "opacity-70" : ""} ${
                              isFirstInGroup ? "rounded-br-md" : ""
                            }`
                          : `bg-white text-stone-800 shadow-sm ring-1 ring-stone-100 ${
                              isFirstInGroup ? "rounded-bl-md" : ""
                            }`
                      }`}
                    >
                      {msg.body}
                    </div>
                  )}

                  {/* Timestamp — only last in group */}
                  {isLastInGroup && (
                    <span className="mt-1 px-1 text-[10px] text-stone-400">
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                </div>

                {/* Host action menu — appears on hover, skip optimistic & deleted */}
                {isHost && !isOptimistic && !msg.deleted_at && sender && (
                  <div className={`mb-1 shrink-0 ${isMe ? "mr-1" : "ml-1"}`}>
                    <HostMenu
                      tripId={tripId}
                      message={msg}
                      senderName={sender.name}
                      senderId={msg.sender_id}
                      isOwnMessage={isMe}
                      onDeleted={handleDeleted}
                      onRemoved={handleRemoved}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          {me && (
            <div className="mb-1 shrink-0">
              <Avatar member={me} size={8} />
            </div>
          )}
          <div className="flex flex-1 items-end gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 focus-within:border-amber-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Message the group…`}
              className="flex-1 resize-none bg-transparent text-sm text-ink placeholder:text-stone-400 focus:outline-none"
              style={{ maxHeight: 120 }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M14 2L7 9M14 2L9 14l-2-5-5-2 12-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-stone-400">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
