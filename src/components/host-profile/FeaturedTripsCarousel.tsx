"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import type { Trip } from "@/types/db";
import type { JoinerAvatar } from "./types";
import { ChevronRightIcon, HeartIcon, SectionLabel } from "./icons";

type FeaturedTripsCarouselProps = {
  trips: Trip[];
  hostId: string;
  joinersByTrip: Map<string, JoinerAvatar[]>;
};

function TripCard({ trip, joiners }: { trip: Trip; joiners: JoinerAvatar[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const isUpcoming = trip.start_date >= today;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_8px_24px_rgba(64,44,26,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(64,44,26,0.12)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {trip.images[0] ? (
          <Image
            src={trip.images[0]}
            alt={trip.title}
            fill
            unoptimized
            sizes="280px"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full bg-stone-200" />
        )}
        {isUpcoming && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow-sm">
            Upcoming
          </span>
        )}
        <button
          type="button"
          aria-label="Save"
          onClick={(e) => e.preventDefault()}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-stone-500 shadow-sm"
        >
          <HeartIcon />
        </button>
      </div>

      <div className="p-4">
        <h4 className="font-serif text-[17px] font-semibold leading-snug text-[#17120f]">
          {trip.title}
        </h4>
        <p className="mt-2 text-[12px] font-medium text-stone-500">
          {trip.days} {trip.days === 1 ? "day" : "days"} · {trip.location}
        </p>

        {joiners.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {joiners.slice(0, 4).map((j) => (
                <span
                  key={j.id}
                  className="relative h-7 w-7 overflow-hidden rounded-full bg-stone-100 ring-2 ring-white"
                >
                  {j.avatar_url ? (
                    <Image src={j.avatar_url} alt={j.name} fill unoptimized sizes="28px" className="object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] font-bold text-stone-500">
                      {j.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {joiners.length > 4 && (
              <span className="text-[12px] font-semibold text-stone-500">+{joiners.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function FeaturedTripsCarousel({
  trips,
  hostId,
  joinersByTrip,
}: FeaturedTripsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const display = trips.slice(0, 6);

  if (display.length === 0) return null;

  return (
    <article id="trips" className="scroll-mt-28 border-t border-stone-200 pt-8">
      <div className="mb-5 flex items-center justify-between">
        <SectionLabel>Featured trips</SectionLabel>
        <Link
          href={`/trips?host=${hostId}`}
          className="text-[12px] font-semibold text-stone-500 hover:text-[#17120f]"
        >
          View all trips &rsaquo;
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {display.slice(0, 3).map((trip) => (
          <TripCard key={trip.id} trip={trip} joiners={joinersByTrip.get(trip.id) ?? []} />
        ))}
      </div>

      {display.length > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {display.slice(0, 3).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full ${i === 0 ? "w-5 bg-[#17120f]" : "w-1.5 bg-stone-300"}`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
            className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          >
            <ChevronRightIcon />
          </button>
        </div>
      )}
    </article>
  );
}
