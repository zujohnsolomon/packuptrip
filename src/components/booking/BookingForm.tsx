"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBooking } from "@/actions/booking";
import { formatINR } from "@/lib/utils";
import { calcServiceFee, calcBookingTotal, SERVICE_FEE_RATE } from "@/lib/pricing";
import type { ItemType } from "@/types/db";

export function BookingForm({
  itemType,
  itemId,
  basePrice,
  accent,
  serviceFeeRate = SERVICE_FEE_RATE,
  isPlus = false,
  availableCredit = 0,
}: {
  itemType: ItemType;
  itemId: string;
  basePrice: number;
  accent: "amber" | "teal";
  /** Live rate from platform_settings — passed by server page. Falls back to
   *  the compile-time constant so existing call sites don't break. */
  serviceFeeRate?: number;
  /** If true, the user is a Plus member and serviceFeeRate is already the discounted rate. */
  isPlus?: boolean;
  /** Sum of promo_credits + referral_credits — auto-applied at checkout. */
  availableCredit?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceFee = calcServiceFee(basePrice, serviceFeeRate);
  const subtotal = calcBookingTotal(basePrice, serviceFeeRate);
  // Credits auto-applied, capped at the booking subtotal
  const creditUsed = Math.min(availableCredit, subtotal);
  const total = subtotal - creditUsed;

  const btn =
    accent === "amber"
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-teal-600 hover:bg-teal-700";

  async function onConfirm() {
    setError(null);
    setLoading(true);
    const { bookingId, error: err } = await confirmBooking(itemType, itemId, creditUsed);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }
    if (bookingId) {
      router.push(`/bookings/${bookingId}`);
      router.refresh();
    } else {
      setError("Something went wrong creating your booking. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        You&rsquo;re paying
      </div>
      <div className="mt-1 text-3xl font-semibold text-ink">
        {formatINR(total)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {isPlus && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
            ✦ Plus rate — {Math.round(serviceFeeRate * 100)}% fee
          </span>
        )}
        {creditUsed > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            🎁 {formatINR(creditUsed)} credit applied
          </span>
        )}
      </div>

      <dl className="mt-5 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
        <Row label="Trip price" value={formatINR(basePrice)} />
        <Row
          label={`Service fee (${Math.round(serviceFeeRate * 100)}%)`}
          value={formatINR(serviceFee)}
        />
        {creditUsed > 0 && (
          <Row
            label="🎁 Credits"
            value={`−${formatINR(creditUsed)}`}
            green
          />
        )}
        <div className="my-1 h-px bg-stone-200" />
        <Row label="Total" value={formatINR(total)} bold />
      </dl>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${btn}`}
      >
        {loading ? "Reserving your spot…" : "Confirm booking"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        No payment is taken right now - we&rsquo;ll request payment closer to
        the trip date. Your money is held by our payment partner and released
        to the host only after your trip begins.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  green = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) {
  const labelCls = bold
    ? "font-semibold text-ink"
    : green
    ? "text-emerald-700"
    : "text-stone-600";
  const valueCls = bold
    ? "font-semibold text-ink"
    : green
    ? "font-medium text-emerald-700"
    : "text-stone-700";
  return (
    <div className="flex items-center justify-between">
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  );
}
