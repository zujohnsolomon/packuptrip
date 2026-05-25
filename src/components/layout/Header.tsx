"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/NotificationBell";
import type { User } from "@supabase/supabase-js";

type ProfileMini = {
  name: string;
  avatar_url: string | null;
  role: string;
  has_trips: boolean;
};

const NAV_LINKS = [
  { href: "/packages", label: "Packages" },
  { href: "/trips", label: "Community trips" },
  { href: "/host", label: "Host a trip" },
];

export function Header({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll behaviour
  useEffect(() => {
    if (!overlay) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  // Auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Don't stay transparent when the mobile menu is open
  const transparent = overlay && !scrolled && !menuOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "border-b border-stone-200/70 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo light={transparent} />

        {/* Desktop nav */}
        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium md:flex transition-colors",
            transparent ? "text-white/90" : "text-stone-700",
          )}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} transparent={transparent}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!authReady ? null : user ? (
            // Logged-in: bell + avatar dropdown
            <>
              <NotificationBell userId={user.id} />
              <AvatarMenu user={user} transparent={transparent} />
            </>
          ) : (
            // Guest: auth buttons + hamburger for nav links
            <>
              <GuestActions transparent={transparent} />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition md:hidden",
                  transparent
                    ? "text-white hover:bg-white/10"
                    : "text-stone-700 hover:bg-stone-100",
                )}
              >
                {menuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="border-t border-stone-200/70 bg-cream/95 px-4 pb-4 pt-2 backdrop-blur md:hidden">
          <nav className="flex flex-col">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                {label}
              </Link>
            ))}
            {authReady && !user && (
              <Link
                href="/login"
                className="mt-1 rounded-xl px-3 py-3 text-sm font-medium text-stone-500 hover:bg-stone-100"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// ─── Avatar button + dropdown ─────────────────────────────────────────────────

function AvatarMenu({
  user,
  transparent,
}: {
  user: User;
  transparent: boolean;
}) {
  const [profile, setProfile] = useState<ProfileMini | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside pointer-down
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Fetch profile + trip count once we know the user
  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("profiles")
        .select("name, avatar_url, role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("host_id", user.id),
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
  }, [user.id]);

  const initial = (profile?.name ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div ref={containerRef} className="relative">
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
            : "ring-stone-200 hover:ring-amber-300",
          open && !transparent && "ring-amber-400",
        )}
      >
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.name}
            fill
            sizes="36px"
            className="rounded-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full select-none items-center justify-center rounded-full text-sm font-bold",
              transparent
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-800",
            )}
          >
            {initial}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_32px_-4px_rgba(0,0,0,0.14),0_2px_8px_-2px_rgba(0,0,0,0.08)]">
          {/* Identity strip */}
          <div className="border-b border-stone-100 px-4 py-3">
            <div className="truncate text-sm font-semibold text-ink">
              {profile?.name ?? user.email}
            </div>
            <div className="truncate text-xs text-stone-400">{user.email}</div>
          </div>

          {/* Mobile-only nav links — desktop has them in the header */}
          <div className="border-b border-stone-100 py-1.5 md:hidden">
            {NAV_LINKS.map(({ href, label }) => (
              <DropdownLink key={href} href={href}>
                {label}
              </DropdownLink>
            ))}
          </div>

          {/* Account navigation */}
          <div className="py-1.5">
            <DropdownLink href="/account">My bookings</DropdownLink>
            {profile?.has_trips && (
              <DropdownLink href="/host/trips">My trips</DropdownLink>
            )}
            <DropdownLink href="/account">Profile</DropdownLink>
            {profile?.role === "admin" && (
              <DropdownLink href="/admin" accent>
                Admin panel
              </DropdownLink>
            )}
          </div>

          {/* Log out */}
          <div className="border-t border-stone-100 py-1.5">
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  children,
  accent = false,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-4 py-2.5 text-sm font-medium transition hover:bg-stone-50",
        accent ? "text-amber-700 hover:text-amber-800" : "text-stone-700 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

// ─── Guest actions ────────────────────────────────────────────────────────────

function GuestActions({ transparent }: { transparent: boolean }) {
  return (
    <>
      <Link
        href="/login"
        className={cn(
          "hidden sm:inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition",
          transparent
            ? "text-white hover:bg-white/10"
            : "text-stone-700 hover:bg-stone-100",
        )}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className={cn(
          "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition shadow-sm",
          transparent
            ? "bg-white text-ink hover:bg-stone-100"
            : "bg-amber-600 text-white hover:bg-amber-700",
        )}
      >
        Sign up
      </Link>
    </>
  );
}

// ─── Shared nav link ──────────────────────────────────────────────────────────

function NavLink({
  href,
  transparent,
  children,
}: {
  href: string;
  transparent: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors",
        transparent ? "hover:text-white" : "hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
