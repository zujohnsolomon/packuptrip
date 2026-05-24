"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { cancelJoinerBooking } from "../../../actions";

export function CancelJoinerButton({
  bookingId,
  tripId,
}: {
  bookingId: string;
  tripId: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-8 items-center rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition hover:bg-red-50"
      >
        Cancel join
      </button>
    );
  }

  return (
    <form action={cancelJoinerBooking} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="trip_id" value={tripId} />
      <span className="text-xs text-stone-600">Free their spot?</span>
      <ConfirmBtn />
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs font-medium text-stone-500 hover:text-ink"
      >
        Keep
      </button>
    </form>
  );
}

function ConfirmBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Cancelling…" : "Yes, cancel"}
    </button>
  );
}
