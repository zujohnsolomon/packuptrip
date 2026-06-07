"use client";

import { useState } from "react";

const CHECKLIST = [
  { id: "legible", label: "ID document is clearly legible — no blur, glare, cropping, or screenshot" },
  { id: "face-match", label: "Face in the live scan clearly matches the face on the ID" },
  { id: "id-type", label: "ID type matches what the user selected (e.g. Aadhaar vs PAN)" },
  { id: "no-edit", label: "No signs of digital manipulation — consistent lighting, fonts, and spacing" },
  { id: "not-expired", label: "Document is not expired (check expiry date where visible)" },
];

export function AdminChecklist({
  onApprove,
  onReject,
  faceScore,
  riskScore,
}: {
  onApprove: () => Promise<void>;
  onReject: (data: FormData) => Promise<void>;
  faceScore: number | null | undefined;
  riskScore: number;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState(false);

  const allChecked = CHECKLIST.every((item) => checked[item.id]);
  const faceWarning = faceScore !== null && faceScore !== undefined && faceScore < 0.4;
  const riskWarning = riskScore > 70;
  const needsOverride = (faceWarning || riskWarning) && !checked["override"];

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleApprove() {
    if (!allChecked || needsOverride) return;
    setApproving(true);
    await onApprove();
  }

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {(faceWarning || riskWarning) && (
        <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-inset ring-red-200">
          <p className="text-sm font-semibold text-red-800">
            ⚠ Flags detected — review carefully
          </p>
          <ul className="mt-2 space-y-1 text-xs text-red-700">
            {faceWarning && <li>• Face match score is below threshold ({((faceScore ?? 0) * 100).toFixed(0)}%)</li>}
            {riskWarning && <li>• Risk score is high ({riskScore}/100)</li>}
          </ul>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={!!checked["override"]}
              onChange={() => toggle("override")}
              className="mt-0.5 accent-red-600"
            />
            <span className="text-xs font-semibold text-red-800">
              I have manually reviewed the flags above and am overriding them
            </span>
          </label>
        </div>
      )}

      {/* Checklist */}
      <div className="rounded-2xl bg-stone-50 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Verification checklist — all items required before approving
        </div>
        <ul className="space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 accent-green-600"
                />
                <span className={`text-sm transition-colors ${checked[item.id] ? "text-green-800 line-through opacity-60" : "text-stone-600"}`}>
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {!allChecked && (
          <p className="mt-3 text-xs text-stone-400">
            Check all items above to enable the Approve button.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={!allChecked || needsOverride || approving}
          onClick={handleApprove}
          className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {approving ? "Approving…" : "✓ Approve — mark as verified"}
        </button>

        <form action={onReject} className="space-y-3">
          <textarea
            name="reason"
            rows={2}
            placeholder="Rejection reason (optional — a default message is used if blank)"
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <button
            type="submit"
            className="w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            ✕ Reject
          </button>
        </form>
      </div>
    </div>
  );
}
