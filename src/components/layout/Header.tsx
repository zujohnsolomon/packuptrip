"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ProfilePanel } from "@/components/layout/ProfilePanel";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/packages", label: "Packages" },
  { href: "/trips", label: "Community trips" },
  { href: "/hosts", label: "Hosts" },
  { href: "/stories", label: "Stories" },
  { href: "/host", label: "Host a trip" },
  { href: "/plus", label: "✦ Plus" },
];

export function Header({
  overlay = false,
  overlayTone = "light",
}: {
  overlay?: boolean;
  overlayTone?: "light" | "dark";
}) {
  const [scrolled, setScrolled] = useState(!overlay);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    const timeout = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  // Scroll behaviour
  useEffect(() => {
    if (!overlay) return;
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
  const lightTransparent = transparent && overlayTone === "light";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "border-b border-stone-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo light={lightTransparent} />

        {/* Desktop nav */}
        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium md:flex transition-colors",
            transparent
              ? overlayTone === "light"
                ? "text-white/90"
                : "text-stone-800"
              : "text-stone-700",
          )}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink
              key={href}
              href={href}
              transparent={transparent}
              overlayTone={overlayTone}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!authReady ? null : user ? (
            // Logged-in: quick Messages access + unified profile panel
            <>
              <Link
                href="/messages"
                aria-label="Messages"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                  pathname.startsWith("/messages")
                    ? "bg-amber-100 text-amber-700"
                    : lightTransparent
                      ? "text-white hover:bg-white/10"
                      : "text-stone-700 hover:bg-stone-100",
                )}
              >
                <EnvelopeIcon />
              </Link>
              <ProfilePanel user={user} transparent={lightTransparent} />
            </>
          ) : (
            // Guest: auth buttons + hamburger for nav links
            <>
              <GuestActions transparent={transparent} overlayTone={overlayTone} />
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full transition md:hidden",
                  lightTransparent
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
        <div className="border-t border-stone-200/70 bg-white/95 px-4 pb-4 pt-2 backdrop-blur md:hidden">
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

// ─── Guest actions ────────────────────────────────────────────────────────────

function GuestActions({
  transparent,
  overlayTone,
}: {
  transparent: boolean;
  overlayTone: "light" | "dark";
}) {
  const lightTransparent = transparent && overlayTone === "light";
  return (
    <>
      <Link
        href="/login"
        className={cn(
          "hidden sm:inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition",
          lightTransparent
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
          lightTransparent
            ? "bg-white text-ink hover:bg-stone-100"
            : "bg-yellow-400 text-stone-900 hover:bg-yellow-500",
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
  overlayTone,
  children,
}: {
  href: string;
  transparent: boolean;
  overlayTone: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors",
        transparent
          ? overlayTone === "light"
            ? "hover:text-white"
            : "hover:text-ink"
          : "hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EnvelopeIcon() {
  return (
    <svg
      width="19"
      height="19"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

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
