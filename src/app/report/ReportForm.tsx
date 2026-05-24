"use client";

import { useFormStatus } from "react-dom";
import { fileReport } from "./actions";

const CATEGORIES: Array<{
  value: "safety" | "harassment" | "fraud" | "other";
  title: string;
  blurb: string;
}> = [
  {
    value: "safety",
    title: "Safety",
    blurb: "Physical safety, dangerous conditions, medical concerns.",
  },
  {
    value: "harassment",
    title: "Harassment",
    blurb: "Sexual, verbal, or discriminatory behaviour.",
  },
  {
    value: "fraud",
    title: "Fraud",
    blurb: "Scams, payment fraud, fake identity, misrepresentation.",
  },
  {
    value: "other",
    title: "Other",
    blurb: "Anything else that doesn't fit above.",
  },
];

export function ReportForm({
  subjectType,
  subjectId,
  bookingId,
}: {
  subjectType: string;
  subjectId: string;
  bookingId?: string;
}) {
  return (
    <form action={fileReport} className="space-y-5">
      <input type="hidden" name="subject_type" value={subjectType} />
      <input type="hidden" name="subject_id" value={subjectId} />
      {bookingId && (
        <input type="hidden" name="booking_id" value={bookingId} />
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">
          What kind of issue?
        </legend>
        <p className="text-xs text-stone-500">
          Pick one - admin will reach out for detail if needed.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white p-3 transition-colors hover:border-red-200 hover:bg-red-50/40 has-[:checked]:border-red-300 has-[:checked]:bg-red-50"
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                required
                className="mt-1 h-4 w-4 border-stone-300 text-red-600 focus:ring-red-500"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">
                  {c.title}
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  {c.blurb}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">
          What happened?
        </span>
        <span className="mb-2 block text-xs text-stone-500">
          Include dates, names if known, and anything specific that helps us
          investigate. The reported person never sees your name.
        </span>
        <textarea
          name="description"
          required
          minLength={4}
          maxLength={4000}
          rows={6}
          placeholder="Describe what happened…"
          className="block w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </label>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
      <p className="text-xs text-stone-500">
        Files are reviewed by humans. Misuse may result in account action.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Sending…" : "Submit report"}
      </button>
    </div>
  );
}
