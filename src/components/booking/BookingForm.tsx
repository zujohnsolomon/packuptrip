"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/utils";
import {
  SERVICE_FEE_RATE,
  calcServiceFee,
  calcBookingTotal,
} from "@/lib/pricing";
import type { ItemType } from "@/types/db";

export function BookingForm({
  itemType,
  itemId,
  basePrice,
  accent,
}: {
  itemType: ItemType;
  itemId: string;
  basePrice: number;
  accent: "amber" | "teal";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceFee = calcServiceFee(basePrice);
  const total = calcBookingTotal(basePrice);

  const btn =
    accent === "amber"
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-teal-600 hover:bg-teal-700";

  async function onConfirm() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_booking", {
      p_item_type: itemType,
      p_item_id: itemId,
    });
    setLoading(false);

    if (error) {
      setError(messageForError(error.code, error.message));
      return;
    }
    if (typeof data === "string" && data.length > 0) {
      router.push(`/bookings/${data}`);
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

      <dl className="mt-5 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
        <Row label="Trip price" value={formatINR(basePrice)} />
        <Row
          label={`Packuptrip service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`}
          value={formatINR(serviceFee)}
        />
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

/** Map Postgres errcodes raised by create_booking to friendly messages. */
function messageForError(code: string | undefined, fallback: string) {
  switch (code) {
    case "42501":
      return "Please sign in to confirm your booking.";
    case "P0001":
      return "Sorry, this trip just sold out. Try another departure.";
    case "P0002":
      return "This trip isn't available anymore.";
    default:
      return fallback || "Couldn't create the booking. Please try again.";
  }
}
