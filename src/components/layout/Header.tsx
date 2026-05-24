"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

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

  // Don't keep transparent when the menu is open — drawer needs a solid bg
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
            <AuthedActions transparent={transparent} />
          ) : (
            <GuestActions transparent={transparent} />
          )}

          {/* Mobile hamburger — hidden on md+ */}
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

function MenuIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AuthedActions({ transparent }: { transparent: boolean }) {
  return (
    <Link
      href="/account"
      className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition shadow-sm",
        transparent
          ? "bg-white text-ink hover:bg-stone-100"
          : "bg-amber-600 text-white hover:bg-amber-700",
      )}
    >
      Your account
    </Link>
  );
}
