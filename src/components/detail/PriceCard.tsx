import Link from "next/link";
import { formatINR } from "@/lib/utils";
import {
  SERVICE_FEE_RATE,
  calcServiceFee,
  calcBookingTotal,
} from "@/lib/pricing";

export function PriceCard({
  basePrice,
  unitLabel,
  ctaLabel,
  ctaHref,
  spotsLeft,
  spotsTotal,
  accent,
  startDate,
  days,
}: {
  basePrice: number;
  unitLabel: string; // "per person" or "per share"
  ctaLabel: string;
  ctaHref: string;
  spotsLeft: number;
  spotsTotal: number;
  accent: "amber" | "teal";
  startDate: string;
  days: number;
}) {
  const serviceFee = calcServiceFee(basePrice);
  const total = calcBookingTotal(basePrice);
  const btn =
    accent === "amber"
      ? "bg-yellow-600 hover:bg-yellow-700"
      : "bg-green-700 hover:bg-green-800";
  const text = accent === "amber" ? "text-yellow-700" : "text-green-800";
  const sparse = spotsLeft <= 3;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-3xl font-semibold text-ink">
            {formatINR(basePrice)}
          </div>
          <div className="text-xs text-stone-500">{unitLabel}</div>
        </div>
        <div className={`text-xs font-semibold ${text}`}>
          {spotsLeft}/{spotsTotal} spots
        </div>
      </div>

      <div className="mt-5 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
        <Row label={`${unitLabel.replace(/^per\s+/, "")} × 1`} value={formatINR(basePrice)} />
        <Row
          label={`Packuptrip service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`}
          value={formatINR(serviceFee)}
        />
        <div className="my-1 h-px bg-stone-200" />
        <Row label="Total today" value={formatINR(total)} bold />
      </div>

      <Link
        href={ctaHref}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition ${btn}`}
      >
        {ctaLabel}
      </Link>

      <div className="mt-4 grid gap-1 text-xs text-stone-500">
        <div>
          <span className="font-medium text-stone-700">Trip starts:</span>{" "}
          {formatHumanDate(startDate)} · {days} days
        </div>
        {sparse && (
          <div className={`font-medium ${text}`}>
            Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
          </div>
        )}
        <div>Your money is held until the trip begins.</div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-stone-600"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-stone-700"}>
        {value}
      </span>
    </div>
  );
}

function formatHumanDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
