"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatINR } from "@/lib/utils";
import type { Trip } from "@/types/db";

/** Host info shown on the card. Either passed in from a join query, or
 *  a placeholder if we don't have it yet. */
export type TripCardHost = {
  name: string;
  avatar?: string | null;
  idVerified?: boolean;
};

function spotsLabel(left: number, total: number) {
  if (left === 0) return { label: "Full", cls: "bg-stone-500/80 text-white" };
  if (left <= 2) return { label: "Almost full", cls: "bg-red-500/90 text-white" };
  if (left / total <= 0.4) return { label: `${left} spots left`, cls: "bg-yellow-500/90 text-stone-900" };
  return { label: `${left} spots left`, cls: "bg-green-700/80 text-white" };
}

export function TripCard({ trip, host }: { trip: Trip; host?: TripCardHost }) {
  const [hearted, setHearted] = useState(false);
  const image = trip.images[0];
  const photoCount = trip.images.length;
  const badge = spotsLabel(trip.spots_left, trip.spots_total);

  const dateStr = new Date(trip.start_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="group relative">
      <Link
        href={`/trips/${trip.id}`}
        className="block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
      >
        {/* ── Photo ─────────────────────────────────────────────────── */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
          {image ? (
            <Image
              src={image}
              alt={trip.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-green-50">
              <MountainIcon />
            </div>
          )}

          {/* Bottom scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Location chip — top left */}
          <div className="absolute left-3 top-3 max-w-[60%]">
            <span className="inline-flex items-center gap-1 truncate rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <PinIcon />
              {trip.location}
            </span>
          </div>

          {/* Photo count — bottom-left, shifted right if host avatar is present */}
          {photoCount > 1 && (
            <div className={`absolute bottom-3 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white backdrop-blur-sm ${host ? "left-14" : "left-3"}`}>
              <CameraIcon />
              {photoCount}
            </div>
          )}

          {/* Spots badge — bottom right */}
          <div className="absolute bottom-3 right-3">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {/* Host avatar — bottom left */}
          {host && (
            <div className="absolute bottom-3 left-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-green-100 ring-2 ring-white shadow-md">
                {host.avatar ? (
                  <Image src={host.avatar} alt={host.name} fill sizes="36px" className="object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs font-bold text-green-900">
                    {host.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Metadata below photo ──────────────────────────────────── */}
        <div className="p-3.5">
          {/* Host name + rating */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-stone-500">
              {host ? (
                <>
                  with{" "}
                  <span className="font-medium text-stone-700">{host.name}</span>
                  {host.idVerified && (
                    <span className="ml-1 text-green-700" title="ID verified">✓</span>
                  )}
                </>
              ) : (
                "Community trip"
              )}
            </span>
            {trip.review_count > 0 && (
              <span className="flex shrink-0 items-center gap-0.5 text-xs">
                <StarFillIcon />
                <span className="font-semibold text-stone-700">
                  {Number(trip.rating_avg).toFixed(1)}
                </span>
                <span className="text-stone-400">({trip.review_count})</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-green-800">
            {trip.title}
          </h3>

          {/* Date · Duration */}
          <p className="mt-1 text-xs text-stone-400">
            {dateStr} · {trip.days} {trip.days === 1 ? "day" : "days"}
          </p>

          {/* Price */}
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-ink">
              {formatINR(Number(trip.price_per_share))}
            </span>
            <span className="text-xs text-stone-400">/ person</span>
          </div>
        </div>
      </Link>

      {/* Heart — outside the link so it doesn't trigger navigation */}
      <button
        onClick={() => setHearted((h) => !h)}
        aria-label={hearted ? "Remove from wishlist" : "Save to wishlist"}
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow transition-all duration-150 ${
          hearted
            ? "bg-white text-red-500 scale-110"
            : "bg-white/90 text-stone-400 hover:text-red-400"
        }`}
      >
        <HeartIcon filled={hearted} />
      </button>
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

function CameraIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5-10 4 8 3-5 4 7H3z" />
    </svg>
  );
}
