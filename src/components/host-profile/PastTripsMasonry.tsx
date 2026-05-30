import Image from "next/image";
import Link from "next/link";
import type { Trip } from "@/types/db";
import { SectionLabel } from "./icons";

type PastTripsMasonryProps = {
  trips: Trip[];
  galleryImages: string[];
};

export function PastTripsMasonry({ trips, galleryImages }: PastTripsMasonryProps) {
  const images =
    galleryImages.length >= 6
      ? galleryImages.slice(0, 6)
      : [
          ...galleryImages,
          ...trips.flatMap((t) => t.images).slice(0, 6 - galleryImages.length),
        ].slice(0, 6);

  if (images.length === 0) return null;

  const featured = images[0];
  const rest = images.slice(1, 6);

  return (
    <article id="gallery">
      <div className="mb-4 flex items-baseline justify-between">
        <SectionLabel>Moments from the road</SectionLabel>
        <span className="text-[11px] text-stone-400">Photo journal</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:grid-rows-2">
        <div className="group relative col-span-2 row-span-2 aspect-square overflow-hidden rounded-2xl bg-stone-100 sm:aspect-auto sm:min-h-[320px]">
          <Image
            src={featured}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <p className="absolute bottom-4 left-4 font-serif text-lg text-white opacity-0 transition group-hover:opacity-100">
            On the road
          </p>
        </div>

        {rest.map((img, i) => (
          <div
            key={`${img}-${i}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"
          >
            <Image
              src={img}
              alt=""
              fill
              unoptimized
              sizes="240px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {trips.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {trips.slice(0, 4).map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 transition hover:border-stone-300 hover:text-[#17120f]"
            >
              {trip.location.split("·")[0]?.trim() ?? trip.title}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
