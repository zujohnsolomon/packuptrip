"use client";

import { useFormStatus } from "react-dom";
import { setReportStatus, saveAdminNotes } from "../actions";
import type { ReportStatus } from "@/types/db";

export function ReportActions({
  reportId,
  status,
  currentNotes,
}: {
  reportId: string;
  status: ReportStatus;
  currentNotes: string;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Workflow
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          open → investigating → resolved. You can re-open a resolved report
          if needed.
        </p>
        <div className="mt-4 grid gap-2">
          {status !== "investigating" && (
            <StatusForm
              reportId={reportId}
              to="investigating"
              label="Start investigating"
              variant="primary"
            />
          )}
          {status !== "resolved" && (
            <StatusForm
              reportId={reportId}
              to="resolved"
              label="Mark resolved"
              variant="emerald"
            />
          )}
          {status === "resolved" && (
            <StatusForm
              reportId={reportId}
              to="open"
              label="Re-open"
              variant="neutral"
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Internal notes
        </div>
        <p className="mt-1.5 text-xs text-stone-500">
          Visible to admins only. Use for investigation log, decisions, who
          you contacted.
        </p>
        <form action={saveAdminNotes} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={reportId} />
          <textarea
            name="notes"
            rows={6}
            defaultValue={currentNotes}
            placeholder="What did you find? Who did you contact? What's the next step?"
            className="block w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
          />
          <SaveButton />
        </form>
      </div>
    </div>
  );
}

function StatusForm({
  reportId,
  to,
  label,
  variant,
}: {
  reportId: string;
  to: ReportStatus;
  label: string;
  variant: "primary" | "emerald" | "neutral";
}) {
  return (
    <form action={setReportStatus}>
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="status" value={to} />
      <SubmitButton label={label} variant={variant} />
    </form>
  );
}

function SubmitButton({
  label,
  variant,
}: {
  label: string;
  variant: "primary" | "emerald" | "neutral";
}) {
  const { pending } = useFormStatus();
  const cls = {
    primary: "bg-yellow-400 hover:bg-yellow-500 text-stone-900",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    neutral:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${cls}`}
    >
      {pending ? "Updating…" : label}
    </button>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : "Save notes"}
    </button>
  );
}
