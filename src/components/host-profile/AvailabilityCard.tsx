import Link from "next/link";
import { formatINR } from "@/lib/utils";
import type { Trip } from "@/types/db";
import { SectionLabel } from "./icons";

type AvailabilityCardProps = {
  upcomingTrips: Trip[];
  hostId: string;
  firstName: string;
  isOwnProfile: boolean;
};

export function AvailabilityCard({
  upcomingTrips,
  hostId,
  firstName,
  isOwnProfile,
}: AvailabilityCardProps) {
  if (upcomingTrips.length === 0) return null;

  const nextTrip = upcomingTrips[0];
  const dateStr = new Date(nextTrip.start_date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="rounded-2xl border border-[#2d5130]/20 bg-[#f4f7f4] p-6 sm:p-7">
      <SectionLabel>Upcoming availability</SectionLabel>
      <h3 className="mt-2 font-serif text-2xl text-[#17120f]">{nextTrip.title}</h3>
      <p className="mt-2 text-[14px] text-stone-600">{dateStr}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-[13px]">
        <span className="font-bold text-[#17120f]">
          {formatINR(nextTrip.price_per_share)} / spot
        </span>
        {nextTrip.spots_left > 0 ? (
          <span className="text-stone-500">{nextTrip.spots_left} spots open</span>
        ) : (
          <span className="font-semibold text-stone-500">Fully booked</span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {isOwnProfile ? (
          <Link
            href={`/host/trips/${nextTrip.id}`}
            className="inline-flex h-10 items-center rounded-lg bg-[#17120f] px-5 text-[13px] font-bold text-white transition hover:bg-stone-800"
          >
            Manage trip
          </Link>
        ) : (
          <>
            <Link
              href={`/trips/${nextTrip.id}`}
              className="inline-flex h-10 items-center rounded-lg bg-[#17120f] px-5 text-[13px] font-bold text-white transition hover:bg-stone-800"
            >
              Join trip
            </Link>
            <Link
              href={`/messages?hostId=${hostId}`}
              className="inline-flex h-10 items-center rounded-lg border border-stone-300 bg-white px-5 text-[13px] font-bold text-stone-700 transition hover:bg-stone-50"
            >
              Ask {firstName}
            </Link>
          </>
        )}
      </div>

      {upcomingTrips.length > 1 && (
        <p className="mt-4 text-[12px] text-stone-500">
          + {upcomingTrips.length - 1} more upcoming{" "}
          {upcomingTrips.length - 1 === 1 ? "trip" : "trips"}
        </p>
      )}
    </section>
  );
}
