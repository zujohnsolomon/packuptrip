import Link from "next/link";
import Image from "next/image";
import { Badge } from "./Badge";
import { formatINR } from "@/lib/utils";
import type { Package } from "@/types/db";

export function PackageCard({ pkg }: { pkg: Package }) {
  const image = pkg.images[0];
  return (
    <Link
      href={`/packages/${pkg.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {image && (
          <Image
            src={image}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="originals">Packuptrip Original</Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-snug text-ink group-hover:text-amber-700 transition-colors">
              {pkg.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-stone-500">{pkg.location}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink">
            <StarIcon /> {Number(pkg.rating_avg).toFixed(1)}
            <span className="text-stone-400 font-normal">({pkg.review_count})</span>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-lg font-semibold text-ink">{formatINR(Number(pkg.price))}</div>
            <div className="text-xs text-stone-500">per person · {pkg.days} days</div>
          </div>
          <div className="text-xs font-medium text-amber-700">
            {pkg.spots_left} spots left
          </div>
        </div>
      </div>
    </Link>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#d97706" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
