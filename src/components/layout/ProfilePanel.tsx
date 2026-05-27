"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/actions/notifications";
import type { NotificationType, ThreadSummary } from "@/types/db";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileMini = {
  name: string;
  avatar_url: string | null;
  role: string;
  has_trips: boolean;
};

type Tab = "notifications" | "chat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function NotifIcon({ type }: { type: NotificationType }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs";
  const map: Record<NotificationType, { bg: string; emoji: string }> = {
    booking_received:       { bg: "bg-green-100",   emoji: "🎒" },
    trip_approved:          { bg: "bg-emerald-100", emoji: "✓" },
    trip_cancelled:         { bg: "bg-red-100",     emoji: "✕" },
    verification_approved:  { bg: "bg-green-100",    emoji: "🛡" },
    verification_rejected:  { bg: "bg-yellow-100",   emoji: "!" },
    new_message:            { bg: "bg-yellow-100",   emoji: "💬" },
    group_message:          { bg: "bg-green-100",    emoji: "👥" },
  };
  const { bg, emoji } = map[type] ?? { bg: "bg-stone-100", emoji: "•" };
  return <div className={`${base} ${bg}`}>{emoji}</div>;
}

// ─── Notifications tab content ────────────────────────────────────────────────

function NotificationsTab({
  userId,
  emailConfirmed,
  onClose,
}: {
  userId: string;
  emailConfirmed: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<Notification[]>()
      .then(({ data }) => {
        const list = data ?? [];
        const now = new Date().toISOString();
        setNotifications(list.map((n) => ({ ...n, read_at: n.read_at ?? now })));
        setLoaded(true);
        if (list.some((n) => !n.read_at)) {
          startTransition(() => markAllNotificationsRead());
        }
      });
  }, [userId]);

  async function handleResendEmail() {
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email: "" }); // email filled by session
    setResending(false);
    setResent(true);
  }

  function handleClick(n: Notification) {
    onClose();
    if (!n.read_at) {
      startTransition(() => markNotificationRead(n.id));
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="flex flex-col">
      {/* Email verification banner */}
      {!emailConfirmed && (
        <div className="mx-3 mt-3 rounded-xl bg-yellow-50 p-3 ring-1 ring-inset ring-yellow-200">
          <p className="text-xs font-semibold text-yellow-500">Confirm your email</p>
          <p className="mt-0.5 text-xs text-yellow-500 leading-relaxed">
            We sent you an activation link. Check your inbox (and spam folder).
          </p>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resending || resent}
            className="mt-2 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-stone-900 hover:bg-yellow-400 disabled:opacity-60"
          >
            {resent ? "Sent ✓" : resending ? "Sending…" : "Resend activation email"}
          </button>
        </div>
      )}

      {/* List */}
      <div className="max-h-[320px] overflow-y-auto">
        {!loaded ? (
          <div className="flex justify-center py-10">
            <svg className="h-5 w-5 animate-spin text-stone-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-2xl">🔔</span>
            <p className="text-sm text-stone-400">All caught up</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                !n.read_at ? "bg-yellow-50/50" : ""
              }`}
            >
              <NotifIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs leading-snug ${!n.read_at ? "font-semibold text-ink" : "text-stone-700"}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">{n.body}</p>
                )}
                <p className="mt-0.5 text-[10px] text-stone-400">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow-500" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Chat tab content ─────────────────────────────────────────────────────────

function ChatTab({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("get_my_threads", { p_user_id: userId })
      .then(({ data }) => {
        setThreads((data ?? []) as ThreadSummary[]);
        setLoaded(true);
      });
  }, [userId]);

  const totalUnread = threads.reduce((s, t) => s + (t.unread_count ?? 0), 0);

  if (!loaded) {
    return (
      <div className="flex justify-center py-10">
        <svg className="h-5 w-5 animate-spin text-stone-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-2xl">💬</span>
        <p className="text-sm text-stone-500">No messages yet</p>
        <Link
          href="/trips"
          onClick={onClose}
          className="rounded-full border border-yellow-500 px-4 py-1.5 text-xs font-semibold text-yellow-400 hover:bg-yellow-50"
        >
          Find a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="max-h-[320px] overflow-y-auto">
      {threads.map((t) => {
        const initials = t.other_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
        const isUnread = (t.unread_count ?? 0) > 0;
        const preview = t.last_body
          ? t.last_sender === userId
            ? `You: ${t.last_body}`
            : t.last_body
          : "No messages yet";

        return (
          <Link
            key={t.thread_id}
            href={`/messages/${t.thread_id}`}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50"
          >
            {/* Avatar */}
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-stone-100">
              {t.other_avatar ? (
                <Image src={t.other_avatar} alt={t.other_name} fill sizes="36px" className="object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-xs font-bold text-stone-500">
                  {initials}
                </span>
              )}
              {isUnread && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`truncate text-xs ${isUnread ? "font-semibold text-ink" : "font-medium text-stone-700"}`}>
                  {t.other_name}
                </span>
                <span className="shrink-0 text-[10px] text-stone-400">{timeAgo(t.last_at)}</span>
              </div>
              {t.trip_title && (
                <p className="truncate text-[10px] text-stone-400">{t.trip_title}</p>
              )}
              <p className={`truncate text-[11px] ${isUnread ? "font-medium text-stone-700" : "text-stone-500"}`}>
                {preview}
              </p>
            </div>
          </Link>
        );
      })}

      {threads.length > 0 && (
        <div className="border-t border-stone-100 px-4 py-2.5 text-center">
          <Link
            href="/messages"
            onClick={onClose}
            className="text-xs font-medium text-yellow-400 hover:text-yellow-500"
          >
            All messages →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ProfilePanel({
  user,
  transparent,
}: {
  user: User;
  transparent: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("notifications");
  const [profile, setProfile] = useState<ProfileMini | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const emailConfirmed = !!user.email_confirmed_at;

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fetch profile + unread counts
  useEffect(() => {
    const supabase = createClient();

    // Profile
    Promise.all([
      supabase.from("profiles").select("name, avatar_url, role").eq("id", user.id).single(),
      supabase.from("trips").select("id", { count: "exact", head: true }).eq("host_id", user.id),
    ]).then(([{ data: p }, { count }]) => {
      if (p) {
        setProfile({
          name: p.name as string,
          avatar_url: p.avatar_url as string | null,
          role: p.role as string,
          has_trips: (count ?? 0) > 0,
        });
      }
    });

    // Unread notifications
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)
      .then(({ count }) => setUnreadNotifs(count ?? 0));

    // Unread messages (via thread list)
    supabase.rpc("get_my_threads", { p_user_id: user.id }).then(({ data }) => {
      const total = ((data ?? []) as ThreadSummary[]).reduce(
        (s, t) => s + (t.unread_count ?? 0),
        0,
      );
      setUnreadMessages(total);
    });

    // Realtime: notification changes
    const channel = supabase
      .channel(`profile-panel-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("read_at", null)
            .then(({ count }) => setUnreadNotifs(count ?? 0));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  const totalUnread = unreadNotifs + unreadMessages + (emailConfirmed ? 0 : 1);
  const initial = (profile?.name ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div ref={panelRef} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 transition focus-visible:outline-none",
          transparent
            ? "ring-white/40 hover:ring-white/60"
            : "ring-stone-200 hover:ring-yellow-300",
          open && !transparent && "ring-yellow-400",
        )}
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.name}
            fill
            sizes="36px"
            className="rounded-full object-cover object-top"
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full select-none items-center justify-center rounded-full text-sm font-bold",
              transparent ? "bg-white/20 text-white" : "bg-yellow-100 text-yellow-400",
            )}
          >
            {initial}
          </span>
        )}
        {/* Unread dot */}
        {totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto bg-white shadow-2xl sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:h-auto sm:max-h-[85vh] sm:w-[340px] sm:rounded-2xl sm:border sm:border-stone-200">

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3.5">
              <span className="text-sm font-semibold text-ink">My profile</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>

            {/* ── Profile row ── */}
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-yellow-100">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.name ?? ""} fill sizes="48px" className="object-cover object-top" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-lg font-bold text-yellow-500">
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{profile?.name ?? user.email}</p>
                <Link
                  href="/account/profile"
                  onClick={() => setOpen(false)}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-stone-500 hover:text-yellow-400"
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M11 2l3 3-8 8H3V10l8-8z"/>
                  </svg>
                  Edit profile
                </Link>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 border-b border-stone-100 px-4 pb-3">
              <TabButton
                active={tab === "notifications"}
                badge={unreadNotifs + (emailConfirmed ? 0 : 1)}
                onClick={() => setTab("notifications")}
              >
                Notifications
              </TabButton>
              <TabButton
                active={tab === "chat"}
                badge={unreadMessages}
                onClick={() => setTab("chat")}
              >
                Chat
              </TabButton>
            </div>

            {/* ── Tab content ── */}
            {tab === "notifications" ? (
              <NotificationsTab
                userId={user.id}
                emailConfirmed={emailConfirmed}
                onClose={() => setOpen(false)}
              />
            ) : (
              <ChatTab userId={user.id} onClose={() => setOpen(false)} />
            )}

            {/* ── Nav group 1: Trips ── */}
            <div className="border-t border-stone-100 py-1.5">
              <PanelLink href="/account" icon={<BookingsIcon />} onClick={() => setOpen(false)}>My bookings</PanelLink>
              {profile?.has_trips && (
                <PanelLink href="/host/trips" icon={<TripsIcon />} onClick={() => setOpen(false)}>My trips</PanelLink>
              )}
              <PanelLink href="/host/new" icon={<CreateTripIcon />} onClick={() => setOpen(false)}>Create a trip</PanelLink>
            </div>

            {/* ── Nav group 2: Account settings ── */}
            <div className="border-t border-dashed border-stone-200 py-1.5">
              <PanelLink href="/account/profile" icon={<PersonIcon />} onClick={() => setOpen(false)}>Personal information</PanelLink>
              <PanelLink href="/account/password" icon={<LockIcon />} onClick={() => setOpen(false)}>Change password</PanelLink>
              <PanelLink href="/account/payments" icon={<PaymentsIcon />} onClick={() => setOpen(false)} highlight>
                Payments &amp; payouts
              </PanelLink>
              <PanelLink href="/account/verify" icon={<VerifyIcon />} onClick={() => setOpen(false)}>Get verified</PanelLink>
            </div>

            {/* ── Nav group 3: Help + Admin ── */}
            <div className="border-t border-dashed border-stone-200 py-1.5">
              <PanelLink href="/trust" icon={<HelpIcon />} onClick={() => setOpen(false)}>Help &amp; trust</PanelLink>
              {profile?.role === "admin" && (
                <PanelLink href="/admin" icon={<AdminIcon />} onClick={() => setOpen(false)} accent>Admin panel</PanelLink>
              )}
            </div>

            {/* ── Sign out ── */}
            <div className="border-t border-stone-100 px-4 pb-5 pt-3">
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-stone-100 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
                >
                  Sign out
                </button>
              </form>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  badge: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-ink text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
          active ? "bg-white/20 text-white" : "bg-red-500 text-white"
        }`}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function PanelLink({
  href,
  icon,
  onClick,
  accent = false,
  highlight = false,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-stone-50 ${
        accent ? "text-yellow-500" : highlight ? "text-yellow-400" : "text-stone-700"
      }`}
    >
      <span className="flex items-center gap-3 text-sm">
        <span className={`flex h-5 w-5 items-center justify-center ${highlight ? "text-yellow-500" : "text-stone-400"}`}>
          {icon}
        </span>
        {children}
      </span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={highlight ? "#f59e0b" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" className={highlight ? "text-yellow-400" : "text-stone-400"}>
        <path d="M6 4l4 4-4 4" />
      </svg>
    </Link>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Panel nav icons ──────────────────────────────────────────────────────────

const iconProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

function BookingsIcon()    { return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function TripsIcon()       { return <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function CreateTripIcon()  { return <svg {...iconProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><path d="M12 7v6M9 10h6"/></svg>; }
function PersonIcon()      { return <svg {...iconProps}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function LockIcon()        { return <svg {...iconProps}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function PaymentsIcon()    { return <svg {...iconProps}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function VerifyIcon()      { return <svg {...iconProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>; }
function HelpIcon()        { return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function AdminIcon()       { return <svg {...iconProps}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>; }
