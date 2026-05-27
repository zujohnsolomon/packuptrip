"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Floats at the bottom of the screen on mobile while the PriceCard is
 * scrolled out of view. Observes an element with id="price-card" and
 * disappears once that element enters the viewport.
 * Hidden entirely on md+ (desktop has the sidebar price card).
 */
export function StickyBookBar({
  basePrice,
  ctaLabel,
  ctaHref,
  spotsLeft,
  accent,
}: {
  basePrice: number;
  ctaLabel: string;
  ctaHref: string;
  spotsLeft: number;
  accent: "amber" | "teal";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById("price-card");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const btn =
    accent === "amber"
      ? "bg-yellow-600 hover:bg-yellow-700"
      : "bg-green-700 hover:bg-green-800";

  const sold = spotsLeft === 0;

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">
            {formatINR(basePrice)}
          </div>
          <div className="text-xs text-stone-500">
            {sold ? "Sold out" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </div>
        </div>
        <Link
          href={sold ? "#" : ctaHref}
          aria-disabled={sold}
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition",
            sold ? "cursor-not-allowed bg-stone-300" : btn,
          )}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
