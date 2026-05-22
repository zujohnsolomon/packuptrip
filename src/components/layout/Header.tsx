"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

export function Header({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

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

  const transparent = overlay && !scrolled;

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

        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium md:flex transition-colors",
            transparent ? "text-white/90" : "text-stone-700",
          )}
        >
          <NavLink href="/packages" transparent={transparent}>
            Packages
          </NavLink>
          <NavLink href="/trips" transparent={transparent}>
            Community trips
          </NavLink>
          <NavLink href="/host" transparent={transparent}>
            Host a trip
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {!authReady ? null : user ? (
            <AuthedActions transparent={transparent} />
          ) : (
            <GuestActions transparent={transparent} />
          )}
        </div>
      </div>
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
