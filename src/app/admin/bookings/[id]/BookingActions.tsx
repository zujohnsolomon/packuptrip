"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cancelBooking, refundBooking } from "../actions";
import { formatINR } from "@/lib/utils";

export function BookingActions({
  bookingId,
  status,
  total,
}: {
  bookingId: string;
  status: string;
  total: number;
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const isTerminal = status === "cancelled" || status === "refunded";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Current status
        </div>
        <div className="mt-1.5">
          <StatusChip status={status} />
        </div>
        {status === "requested" && (
          <p className="mt-3 text-xs text-stone-500">
            No payment captured yet. Once Epic 7 lands, this flips to{" "}
            <strong className="font-semibold">confirmed</strong> when the
            deposit is taken.
          </p>
        )}
        {status === "refunded" && (
          <p className="mt-3 text-xs text-stone-500">
            Refund recorded for {formatINR(total)}. Real money movement happens
            in the payments admin.
          </p>
        )}
      </div>

      {!isTerminal && (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Cancel
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            Frees the spot back on the trip. Traveller is notified once
            messaging ships.
          </p>

          {!cancelOpen ? (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel this booking…
            </button>
          ) : (
            <form action={cancelBooking} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={bookingId} />
              <textarea
                name="reason"
                rows={3}
                placeholder="Internal note (e.g. traveller requested cancel, host cancelled trip, fraud). Not shown to traveller yet."
                className="block w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <div className="flex gap-2">
                <SubmitButton
                  label="Confirm cancel"
                  pendingLabel="Cancelling…"
                  variant="danger"
                  className="flex-1"
                />
                <CancelBtn onClick={() => setCancelOpen(false)} />
              </div>
            </form>
          )}
        </div>
      )}

      {status !== "refunded" && (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Refund
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            Marks status as refunded. Once Epic 7 lands, this triggers the
            real refund through Razorpay/Cashfree.
          </p>
          <form action={refundBooking} className="mt-3">
            <input type="hidden" name="id" value={bookingId} />
            <SubmitButton
              label={`Mark refunded · ${formatINR(total)}`}
              pendingLabel="Refunding…"
              variant="neutral"
            />
          </form>
        </div>
      )}
    </div>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  variant,
  className = "",
}: {
  label: string;
  pendingLabel: string;
  variant: "danger" | "neutral";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${cls} ${className || "w-full"}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
    >
      Cancel
    </button>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-200 text-stone-700 ring-stone-300",
    refunded: "bg-red-100 text-red-800 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
        styles[status] ?? styles.requested
      }`}
    >
      {status}
    </span>
  );
}
