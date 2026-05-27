"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveTripEdits } from "../../actions";

type Defaults = {
  title: string;
  location: string;
  description: string;
  includes: string; // newline-separated
  tags: string; // comma-separated
};

export function EditTripForm({
  id,
  defaults,
}: {
  id: string;
  defaults: Defaults;
}) {
  const [publishOnSave, setPublishOnSave] = useState(false);

  return (
    <form action={saveTripEdits} className="space-y-5">
      <input type="hidden" name="id" value={id} />

      <Field label="Title">
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title}
          className={inputCls}
        />
      </Field>

      <Field label="Location">
        <input
          name="location"
          type="text"
          required
          defaultValue={defaults.location}
          className={inputCls}
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={5}
          defaultValue={defaults.description}
          className={`${inputCls} resize-y`}
          placeholder="Short pitch travellers will read on the detail page."
        />
      </Field>

      <Field
        label="What's included"
        hint="One per line. E.g. 'Hotel for 2 nights', 'All breakfasts', 'Local guide'."
      >
        <textarea
          name="includes"
          rows={6}
          defaultValue={defaults.includes}
          className={`${inputCls} resize-y font-mono text-xs`}
        />
      </Field>

      <Field
        label="Tags"
        hint="Comma-separated. E.g. 'Mountains, Adventure, Weekend'."
      >
        <input
          name="tags"
          type="text"
          defaultValue={defaults.tags}
          className={inputCls}
        />
      </Field>

      <input type="hidden" name="publish" value={publishOnSave ? "1" : "0"} />

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={publishOnSave}
            onChange={(e) => setPublishOnSave(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-yellow-400 focus:ring-yellow-500"
          />
          Publish after saving (sets status to live)
        </label>
        <SaveButton publishOnSave={publishOnSave} />
      </div>
    </form>
  );
}

function SaveButton({ publishOnSave }: { publishOnSave: boolean }) {
  const { pending } = useFormStatus();
  const label = publishOnSave ? "Save & approve" : "Save changes";
  const pendingLabel = publishOnSave ? "Publishing…" : "Saving…";
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-400 px-6 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

const inputCls =
  "block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </span>
      {hint && (
        <span className="mb-2 block text-xs text-stone-500">{hint}</span>
      )}
      {children}
    </label>
  );
}
