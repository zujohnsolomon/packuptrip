import type { ReviewWithAuthor } from "@/types/db";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="text-sm"
          style={{ color: rating >= s ? "#d97706" : "#d6d3d1" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 shrink-0 text-stone-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-indigo-400"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-4 text-right font-medium text-stone-600">{value}</span>
    </div>
  );
}

const DIMENSION_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  communication: "Communication",
  experience: "Experience",
  value: "Value",
  punctuality: "Punctuality",
  vibe: "Travel vibe",
};

export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  const initials = review.author.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dimEntries = Object.entries(review.dimensions ?? {}).filter(
    ([, v]) => typeof v === "number" && v > 0
  );

  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">
              {review.author.name}
            </span>
            <span className="shrink-0 text-xs text-stone-400">{date}</span>
          </div>
          <Stars rating={review.rating} />
        </div>
      </div>

      {/* Tags */}
      {review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-inset ring-indigo-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Written text */}
      {review.text && (
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {review.text}
        </p>
      )}

      {/* Dimension breakdown */}
      {dimEntries.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
          {dimEntries.map(([key, val]) => (
            <DimensionBar
              key={key}
              label={DIMENSION_LABELS[key] ?? key}
              value={val as number}
            />
          ))}
        </div>
      )}
    </div>
  );
}
