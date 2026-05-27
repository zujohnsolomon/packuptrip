import Image from "next/image";
import { formatINR } from "@/lib/utils";

/** Read-only summary card shown on the checkout and confirmation pages. */
export function BookingSummary({
  variant,
  title,
  location,
  image,
  startDate,
  days,
  basePrice,
  unitLabel,
}: {
  variant: "originals" | "community";
  title: string;
  location: string;
  image: string;
  startDate: string;
  days: number;
  basePrice: number;
  unitLabel: string;
}) {
  const ribbon =
    variant === "originals"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : "bg-green-100 text-green-900 ring-green-200";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
      <div className="relative aspect-[16/10] w-full bg-stone-100">
        {image && (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1152px) 60vw, 600px"
            className="object-cover"
          />
        )}
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${ribbon}`}
        >
          {variant === "originals" ? "Packuptrip Original" : "Community trip"}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{location}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Departs</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {formatHumanDate(startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Duration</dt>
            <dd className="mt-0.5 font-medium text-ink">{days} days</dd>
          </div>
          <div>
            <dt className="text-stone-500">{unitLabel}</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {formatINR(basePrice)}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">You&rsquo;re booking</dt>
            <dd className="mt-0.5 font-medium text-ink">1 spot</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function formatHumanDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
