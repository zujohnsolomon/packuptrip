"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/actions/notifications";
import type { NotificationType } from "@/types/db";

// ─── Icon per notification type ───────────────────────────────────────────────

function TypeIcon({ type }: { type: NotificationType }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full";

  if (type === "booking_received") {
    return (
      <div className={`${base} bg-teal-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-teal-700">
          <path d="M13 2H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  if (type === "trip_approved") {
    return (
      <div className={`${base} bg-emerald-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-emerald-700">
          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  if (type === "trip_cancelled") {
    return (
      <div className={`${base} bg-red-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-red-600">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  if (type === "verification_approved") {
    return (
      <div className={`${base} bg-teal-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-teal-700">
          <path d="M8 1.5L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  if (type === "verification_rejected") {
    return (
      <div className={`${base} bg-amber-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-amber-700">
          <path d="M8 1.5L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 5.5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  if (type === "group_message") {
    return (
      <div className={`${base} bg-teal-100`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-teal-700">
          <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <circle cx="5.5" cy="7" r="0.75" fill="currentColor"/>
          <circle cx="8" cy="7" r="0.75" fill="currentColor"/>
          <circle cx="10.5" cy="7" r="0.75" fill="currentColor"/>
        </svg>
      </div>
    );
  }

  // new_message
  return (
    <div className={`${base} bg-amber-100`}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-amber-700">
        <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
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

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Load notifications on first open ──────────────────────────────────────
  async function loadNotifications() {
    const data = await getNotifications();
    setNotifications(data);
    setUnread(data.filter((n) => !n.read_at).length);
    setLoaded(true);
  }

  // ── Realtime subscription: fires when DB inserts/updates a notification ───
  useEffect(() => {
    const supabase = createClient();

    // Initial unread count
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .then(({ count }) => setUnread(count ?? 0));

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refresh count and, if panel is open, full list
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .is("read_at", null)
            .then(({ count }) => setUnread(count ?? 0));

          if (open) loadNotifications();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, open]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Open / toggle ─────────────────────────────────────────────────────────
  function handleOpen() {
    setOpen((prev) => {
      if (!prev) loadNotifications();
      return !prev;
    });
  }

  // ── Click a notification ──────────────────────────────────────────────────
  function handleClick(n: Notification) {
    setOpen(false);
    if (!n.read_at) {
      // Optimistic
      setNotifications((prev) =>
        prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)
      );
      setUnread((c) => Math.max(0, c - 1));
      startTransition(() => markNotificationRead(n.id));
    }
    if (n.link) router.push(n.link);
  }

  // ── Mark all read ─────────────────────────────────────────────────────────
  function handleMarkAll() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnread(0);
    startTransition(() => markAllNotificationsRead());
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-stone-400 hover:text-teal-600 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {!loaded ? (
              <div className="flex items-center justify-center py-10">
                <svg className="h-5 w-5 animate-spin text-stone-300" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-200">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p className="text-sm text-stone-400">All caught up</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                    !n.read_at ? "bg-amber-50/60" : ""
                  }`}
                >
                  <TypeIcon type={n.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.read_at ? "font-semibold text-ink" : "text-stone-700"}`}>
                        {n.title}
                      </p>
                      {!n.read_at && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      )}
                    </div>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-stone-400">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-stone-100 px-4 py-2.5 text-center">
              <span className="text-[11px] text-stone-400">
                Last {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
