import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";
import { formatINR } from "@/lib/utils";
import type { Trip } from "@/types/db";

/** Host info shown on the card. Either passed in from a join query, or
 *  a placeholder if we don't have it yet. */
export type TripCardHost = {
  name: string;
  avatar?: string | null;
  idVerified?: boolean;
};

export function TripCard({ trip, host }: { trip: Trip; host?: TripCardHost }) {
  const image = trip.images[0];
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {image && (
          <Image
            src={image}
            alt={trip.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="community">Community trip</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-teal-700 transition-colors">
          {trip.title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-stone-500">{trip.location}</p>

        {host && (
          <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-white">
              {host.avatar ? (
                <Image
                  src={host.avatar}
                  alt={host.name}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-[10px] font-semibold text-teal-800">
                  {host.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="truncate">
              Hosted by {host.name}
              {host.idVerified && (
                <span className="ml-1 text-teal-700">· ID verified</span>
              )}
            </span>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-semibold text-ink">
              {formatINR(Number(trip.price_per_share))}
            </div>
            <div className="text-xs text-stone-500">
              per share · {trip.days} days
            </div>
          </div>
          <div className="text-xs font-medium text-teal-700">
            {trip.spots_left}/{trip.spots_total} spots
          </div>
        </div>
      </div>
    </Link>
  );
}
