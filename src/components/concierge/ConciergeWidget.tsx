"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const GREETING: Message = {
  role: "assistant",
  content: "Hey there 👋 I'm Packy, your travel concierge. Tell me where you want to go, your budget, or the kind of trip you're after — I'll find the best options for you!",
};

export function ConciergeWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "Something went wrong — please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] ring-1 ring-stone-200 sm:right-6">

          {/* Header */}
          <div className="flex items-center justify-between bg-teal-700 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-sm">
                🧭
              </div>
              <div>
                <p className="text-xs font-bold text-white">Packy</p>
                <p className="text-[10px] text-teal-200">AI travel concierge</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 text-teal-200 hover:bg-teal-600 hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs">🧭</div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-stone-100 px-3 py-2 text-sm">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "0ms" }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "150ms" }} />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-stone-100 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about destinations, budget, dates…"
                disabled={loading}
                className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-ink placeholder-stone-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-60"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-stone-400">
              AI · may make mistakes · verify on trip page
            </p>
          </div>
        </div>
      )}

      {/* ── Floating trigger button ───────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close concierge" : "Open AI travel concierge"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-teal-600/20 transition hover:bg-teal-700 active:scale-95 sm:right-6"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <span className="text-2xl leading-none">🧭</span>
        )}
      </button>
    </>
  );
}

/** Renders a single chat bubble, turning /trips/... and /packages/... into links */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-teal-600 px-3 py-2 text-xs text-white">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant bubble — parse inline links like /trips/uuid or /packages/uuid
  const parts = parseLinks(message.content);

  return (
    <div className="flex items-start gap-2">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs">
        🧭
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-stone-100 px-3 py-2 text-xs text-ink leading-relaxed">
        {parts.map((part, i) =>
          typeof part === "string" ? (
            <span key={i}>{part}</span>
          ) : (
            <Link
              key={i}
              href={part.href}
              className="font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              {part.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

type LinkPart = { href: string; label: string };
type Part     = string | LinkPart;

/** Split message text into strings and link objects for internal routes */
function parseLinks(text: string): Part[] {
  // Match Markdown links: [label](href) where href starts with /trips or /packages
  const LINK_RE = /\[([^\]]+)\]\((\/(?:trips|packages)\/[^\s)]+)\)/g;
  // Also match bare paths like /trips/abc or /packages/abc
  const BARE_RE = /(\/(?:trips|packages)\/[a-z0-9-]+)/g;

  const parts: Part[] = [];
  let last = 0;

  // First pass: markdown links
  let md: RegExpExecArray | null;
  const mdMatches: Array<{ index: number; end: number; label: string; href: string }> = [];
  LINK_RE.lastIndex = 0;
  while ((md = LINK_RE.exec(text)) !== null) {
    mdMatches.push({ index: md.index, end: md.index + md[0].length, label: md[1], href: md[2] });
  }

  if (mdMatches.length === 0) {
    // Fall back to bare path matching
    let bare: RegExpExecArray | null;
    BARE_RE.lastIndex = 0;
    while ((bare = BARE_RE.exec(text)) !== null) {
      if (bare.index > last) parts.push(text.slice(last, bare.index));
      parts.push({ href: bare[1], label: "View trip →" });
      last = bare.index + bare[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
  } else {
    for (const m of mdMatches) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      parts.push({ href: m.href, label: m.label });
      last = m.end;
    }
    if (last < text.length) parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : [text];
}
