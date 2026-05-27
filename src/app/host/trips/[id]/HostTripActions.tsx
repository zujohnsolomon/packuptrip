"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitMyDraft, cancelMyTrip } from "../../actions";
import type { TripStatus } from "@/types/db";

export function HostTripActions({
  tripId,
  status,
  hasFeedback,
}: {
  tripId: string;
  status: TripStatus;
  hasFeedback: boolean;
}) {
  const editable = status === "draft" || status === "pending";
  const canSubmitDirect = status === "draft" && !hasFeedback;
  const cancellable = status !== "cancelled" && status !== "completed";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Actions
      </div>
      <p className="mt-1.5 text-xs text-stone-500">
        {explanationFor(status, hasFeedback)}
      </p>

      <div className="mt-4 grid gap-2">
        {editable && (
          <Link
            href={`/host/trips/${tripId}/edit`}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-green-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            {status === "pending" || hasFeedback
              ? "Edit & resubmit"
              : "Edit trip"}
          </Link>
        )}

        {canSubmitDirect && (
          <form action={submitMyDraft}>
            <input type="hidden" name="id" value={tripId} />
            <SubmitButton
              label="Submit for review"
              pendingLabel="Submitting…"
              variant="primary"
            />
          </form>
        )}

        {status === "live" && (
          <Link
            href={`/trips/${tripId}`}
            target="_blank"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            View public page →
          </Link>
        )}

        {cancellable && (
          <CancelControl tripId={tripId} />
        )}
      </div>
    </div>
  );
}

function CancelControl({ tripId }: { tripId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancel this trip
      </button>
    );
  }
  return (
    <form action={cancelMyTrip} className="space-y-2">
      <input type="hidden" name="id" value={tripId} />
      <p className="text-xs text-stone-600">
        Cancelling pulls the trip from listings. Any joiners will be notified
        once messaging ships. Continue?
      </p>
      <div className="flex gap-2">
        <SubmitButton
          label="Yes, cancel"
          pendingLabel="Cancelling…"
          variant="danger"
          className="flex-1"
          fullWidth={false}
        />
        <CancelBtn onClick={() => setConfirming(false)} />
      </div>
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  variant,
  className = "",
  fullWidth = true,
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger";
  className?: string;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-red-600 hover:bg-red-700 text-white";
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
        fullWidth ? "w-full" : "",
        cls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
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
      Keep it
    </button>
  );
}

function explanationFor(status: TripStatus, hasFeedback: boolean): string {
  if (status === "draft") {
    return hasFeedback
      ? "Admin sent feedback. Edit the trip and resubmit."
      : "Only you can see this draft. Edit any time, submit when ready.";
  }
  if (status === "pending") {
    return hasFeedback
      ? "Admin requested changes. Edit and the trip stays in the queue."
      : "Waiting for admin review. You'll see status change here when it's decided.";
  }
  if (status === "live") {
    return "Live and visible to travellers. To change anything, cancel and post a new trip.";
  }
  if (status === "completed") {
    return "This trip has wrapped. Reviews and stats live here.";
  }
  return "Cancelled. No longer visible to travellers.";
}
