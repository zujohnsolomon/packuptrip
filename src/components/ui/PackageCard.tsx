"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatINR } from "@/lib/utils";
import type { Package } from "@/types/db";

/* Try the native share sheet (mobile), fall back to clipboard. */
async function shareOrCopy(opts: { title: string; text: string; url: string }) {
  if (typeof navigator === "undefined") return "cancelled" as const;

  // Use a separate boolean so TS doesn't narrow `navigator` itself
  const canShare = typeof navigator.share === "function";
  if (canShare) {
    try {
      await navigator.share(opts);
      return "shared" as const;
    } catch {
      return "cancelled" as const;
    }
  }

  try {
    await navigator.clipboard.writeText(opts.url);
    return "copied" as const;
  } catch {
    return "cancelled" as const;
  }
}

function spotsLabel(left: number, total: number) {
  if (left === 0) return { label: "Sold out", cls: "bg-stone-500/80 text-white" };
  if (left <= 2) return { label: "Almost full", cls: "bg-red-500/90 text-white" };
  if (left / total <= 0.4) return { label: `${left} spots left`, cls: "bg-yellow-500/90 text-stone-900" };
  return { label: `${left} spots left`, cls: "bg-yellow-500/80 text-stone-900" };
}

export function PackageCard({ pkg }: { pkg: Package }) {
  const [copied, setCopied] = useState(false);
  const image = pkg.images[0];
  const photoCount = pkg.images.length;
  const badge = spotsLabel(pkg.spots_left, pkg.spots_total);

  const dateStr = new Date(pkg.start_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="group relative">
      <Link
        href={`/packages/${pkg.id}`}
        className="block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
      >
        {/* ── Photo ─────────────────────────────────────────────────── */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
          {image ? (
            <Image
              src={image}
              alt={pkg.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-yellow-50">
              <MountainIcon />
            </div>
          )}

          {/* Bottom scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* "Original" chip — top left */}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/90 px-2.5 py-1 text-[11px] font-semibold text-stone-900 backdrop-blur-sm">
              ✦ Original
            </span>
          </div>

          {/* Spots badge — bottom right */}
          <div className="absolute bottom-3 right-3">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {/* Location chip — bottom left */}
          <div className="absolute bottom-3 left-3 max-w-[55%]">
            <span className="inline-flex items-center gap-1 truncate rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <PinIcon />
              {pkg.location}
            </span>
          </div>
        </div>

        {/* ── Metadata below photo ──────────────────────────────────── */}
        <div className="p-3.5">
          {/* Rating row — only show rating; brand label removed since the
             'Original' chip on the photo already says it. Frees space for
             the rating not to truncate on narrow viewports. */}
          {pkg.review_count > 0 && (
            <div className="flex items-center gap-0.5 text-xs">
              <StarFillIcon />
              <span className="font-semibold text-stone-700">
                {Number(pkg.rating_avg).toFixed(1)}
              </span>
              <span className="text-stone-400">({pkg.review_count})</span>
            </div>
          )}

          {/* Title — fixed 2-line clamp ensures equal-height cards in a row */}
          <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-yellow-500">
            {pkg.title}
          </h3>

          {/* Date + price — primary decision row. Side-by-side, both prominent. */}
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-stone-100 pt-2.5">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Departs
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-ink">
                {dateStr}
                <span className="ml-1 text-xs font-normal text-stone-500">
                  · {pkg.days}d
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                Price per person
              </div>
              <div className="mt-0.5 text-sm font-bold text-ink">
                {formatINR(Number(pkg.price))}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Share — native share sheet on mobile, copies link on desktop */}
      <button
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const result = await shareOrCopy({
            title: pkg.title,
            text: `Check out this trip on Packuptrip: ${pkg.title}`,
            url: `${window.location.origin}/packages/${pkg.id}`,
          });
          if (result === "copied") {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        }}
        aria-label="Share this package"
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow transition-colors hover:text-ink"
      >
        <ShareIcon />
      </button>

      {copied && (
        <span className="pointer-events-none absolute right-3 top-12 z-10 rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white shadow-lg">
          Link copied
        </span>
      )}
    </div>
  );
}

/* ── Mini icons ──────────────────────────────────────────────────────────── */

function PinIcon() {
  return (
    <svg width="9" height="10" viewBox="0 0 10 12" fill="currentColor" aria-hidden>
      <path d="M5 0C2.8 0 1 1.8 1 4c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5C4.2 5.5 3.5 4.8 3.5 4S4.2 2.5 5 2.5 6.5 3.2 6.5 4 5.8 5.5 5 5.5z" />
    </svg>
  );
}

function StarFillIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5-10 4 8 3-5 4 7H3z" />
    </svg>
  );
}
