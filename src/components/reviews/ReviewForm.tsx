"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

// ─── Tag pools ───────────────────────────────────────────────────────────────

const JOINER_TAGS = [
  "Great host",
  "Honest listing",
  "Flexible",
  "Fun group",
  "Great value",
  "Well organised",
  "Would join again",
  "Memorable trip",
];

const HOST_TAGS = [
  "Great traveller",
  "Punctual",
  "Easy-going",
  "Good communicator",
  "Respectful",
  "Would host again",
  "Team player",
];

const JOINER_DIMENSIONS: { key: string; label: string; hint: string }[] = [
  { key: "accuracy", label: "Accuracy", hint: "Did the listing match reality?" },
  { key: "communication", label: "Communication", hint: "Was the host easy to reach?" },
  { key: "experience", label: "Experience", hint: "How was the trip itself?" },
  { key: "value", label: "Value", hint: "Worth the price?" },
];

const HOST_DIMENSIONS: { key: string; label: string; hint: string }[] = [
  { key: "punctuality", label: "Punctuality", hint: "Showed up on time?" },
  { key: "communication", label: "Communication", hint: "Easy to keep in touch?" },
  { key: "vibe", label: "Travel vibe", hint: "Good companion for the group?" },
];

// ─── Star picker ─────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const sz = size === "lg" ? "text-4xl" : "text-2xl";
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${sz} leading-none transition-transform hover:scale-110 focus:outline-none`}
          style={{ color: (hover || value) >= star ? "#d97706" : "#d6d3d1" }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Dimension row ────────────────────────────────────────────────────────────

function DimensionRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-xs text-stone-400">{hint}</div>
      </div>
      <StarPicker value={value} onChange={onChange} size="sm" />
    </div>
  );
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-yellow-600 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Submit review"}
    </button>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function ReviewForm({
  isHost,
  isPackage,
  deadlineDate,
  action,
}: {
  isHost: boolean;
  isPackage: boolean;
  deadlineDate: Date;
  action: (fd: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tags = isHost ? HOST_TAGS : JOINER_TAGS;
  const dimensions = isHost ? HOST_DIMENSIONS : JOINER_DIMENSIONS;
  const [dimValues, setDimValues] = useState<Record<string, number>>(
    Object.fromEntries(dimensions.map((d) => [d.key, 0]))
  );

  const daysLeft = Math.max(
    0,
    Math.ceil((deadlineDate.getTime() - Date.now()) / 86_400_000)
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleAction(fd: FormData) {
    fd.set("rating", String(rating));
    fd.set("tags", selectedTags.join(","));
    fd.set("dimensions", JSON.stringify(dimValues));
    await action(fd);
  }

  const canSubmit = rating > 0;

  return (
    <form ref={formRef} action={handleAction} className="space-y-8">
      {/* Deadline notice */}
      <div className="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800 ring-1 ring-inset ring-yellow-200">
        {isPackage
          ? "Your review will be published immediately."
          : `Your review stays hidden until the ${isHost ? "joiner" : "host"} also reviews, or in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — whichever comes first.`}
      </div>

      {/* Overall rating */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Overall rating
        </div>
        <StarPicker value={rating} onChange={setRating} size="lg" />
        {rating === 0 && (
          <p className="mt-2 text-xs text-stone-400">Tap a star to rate</p>
        )}
      </div>

      {/* Dimension ratings */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Rate the details
        </div>
        <div className="space-y-5">
          {dimensions.map((d) => (
            <DimensionRow
              key={d.key}
              label={d.label}
              hint={d.hint}
              value={dimValues[d.key]}
              onChange={(v) =>
                setDimValues((prev) => ({ ...prev, [d.key]: v }))
              }
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Quick highlights <span className="font-normal normal-case text-stone-400">(optional)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                }`}
              >
                {active && <span className="mr-1">✓</span>}
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Written review */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <label
          htmlFor="text"
          className="mb-3 block text-sm font-semibold uppercase tracking-wider text-stone-400"
        >
          Write a review <span className="font-normal normal-case text-stone-400">(optional)</span>
        </label>
        <textarea
          id="text"
          name="text"
          rows={4}
          placeholder={
            isHost
              ? "What was it like having them as a travel companion?"
              : "What made this trip memorable? What should future joiners know?"
          }
          className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink placeholder:text-stone-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-100"
        />
      </div>

      {!canSubmit && (
        <p className="text-center text-xs text-stone-400">
          Please give an overall star rating to continue
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
