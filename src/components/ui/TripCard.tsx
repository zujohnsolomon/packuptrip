import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";
import { formatINR } from "@/lib/utils";
import type { SeedTrip } from "@/lib/seed-data";

export function TripCard({ trip }: { trip: SeedTrip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <Image
          src={trip.image}
          alt={trip.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <Badge variant="community">Community trip</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-teal-700 transition-colors">
          {trip.title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-stone-500">{trip.location}</p>

        <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
          <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
            <Image
              src={trip.host.avatar}
              alt={trip.host.name}
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="truncate">
            Hosted by {trip.host.name}
            {trip.host.idVerified && (
              <span className="ml-1 text-teal-700">· ID verified</span>
            )}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-semibold text-ink">
              {formatINR(trip.pricePerShare)}
            </div>
            <div className="text-xs text-stone-500">
              per share · {trip.days} days
            </div>
          </div>
          <div className="text-xs font-medium text-teal-700">
            {trip.spotsLeft}/{trip.spotsTotal} spots
          </div>
        </div>
      </div>
    </Link>
  );
}
