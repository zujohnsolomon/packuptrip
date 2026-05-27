"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  approveTrip,
  rejectTrip,
  requestTripChanges,
} from "../actions";

type Mode = "idle" | "rejecting" | "requesting";

export function ApprovalPanel({
  tripId,
  disabled,
}: {
  tripId: string;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("idle");

  if (disabled) return null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Decide
      </div>

      {mode === "idle" && (
        <div className="mt-3 grid gap-2">
          <form action={approveTrip}>
            <input type="hidden" name="id" value={tripId} />
            <SubmitButton
              variant="primary"
              pendingLabel="Publishing…"
              label="Approve & publish"
            />
          </form>

          <button
            type="button"
            onClick={() => setMode("requesting")}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Request changes
          </button>

          <button
            type="button"
            onClick={() => setMode("rejecting")}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      )}

      {mode === "rejecting" && (
        <ActionForm
          title="Reject this trip"
          subtitle="Reason is shown to the host on their dashboard."
          name="reason"
          placeholder="What needs to change for this to be approved later? (e.g. price seems inflated, photos don't match destination, itinerary is unclear)"
          submitLabel="Reject trip"
          pendingLabel="Rejecting…"
          submitVariant="danger"
          tripId={tripId}
          onCancel={() => setMode("idle")}
          action={rejectTrip}
        />
      )}

      {mode === "requesting" && (
        <ActionForm
          title="Request changes"
          subtitle="Trip stays in this queue. Host edits and resubmits."
          name="notes"
          placeholder="What needs to change before approval? (e.g. add 2 more photos, fix the spelling of Hampta, mention if alcohol is okay)"
          submitLabel="Send notes to host"
          pendingLabel="Sending…"
          submitVariant="neutral"
          tripId={tripId}
          onCancel={() => setMode("idle")}
          action={requestTripChanges}
        />
      )}
    </div>
  );
}

function ActionForm({
  title,
  subtitle,
  name,
  placeholder,
  submitLabel,
  pendingLabel,
  submitVariant,
  tripId,
  onCancel,
  action,
}: {
  title: string;
  subtitle: string;
  name: string;
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  submitVariant: "danger" | "neutral";
  tripId: string;
  onCancel: () => void;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="mt-3 space-y-3">
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
      </div>
      <input type="hidden" name="id" value={tripId} />
      <textarea
        name={name}
        required
        minLength={4}
        rows={4}
        placeholder={placeholder}
        className="block w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
      />
      <div className="flex gap-2">
        <SubmitButton
          variant={submitVariant === "danger" ? "danger" : "dark"}
          pendingLabel={pendingLabel}
          label={submitLabel}
          fullWidth={false}
          className="flex-1"
        />
        <CancelButton onClick={onCancel} />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Form-aware submit button - uses useFormStatus so disabling never races     */
/* with the actual Server Action submission.                                  */
/* -------------------------------------------------------------------------- */

function SubmitButton({
  label,
  pendingLabel,
  variant,
  fullWidth = true,
  className = "",
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "danger" | "dark";
  fullWidth?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();

  const variantClass =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-700"
        : "bg-stone-900 hover:bg-stone-800";

  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
        fullWidth ? "w-full" : "",
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  // Disable Cancel while the surrounding form is pending so the user can't
  // close the form mid-submit and lose feedback.
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
