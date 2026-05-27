import type { ReviewWithAuthor } from "@/types/db";
import { ReviewCard } from "./ReviewCard";

function RatingSummary({
  reviews,
  ratingAvg,
  reviewCount,
}: {
  reviews: ReviewWithAuthor[];
  ratingAvg: number;
  reviewCount: number;
}) {
  if (reviewCount === 0) return null;

  // Distribution count
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:gap-10">
      {/* Big average */}
      <div className="shrink-0 text-center">
        <div className="text-5xl font-bold text-ink">{ratingAvg.toFixed(1)}</div>
        <div className="mt-1 flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className="text-lg"
              style={{ color: ratingAvg >= s ? "#d97706" : "#d6d3d1" }}
            >
              ★
            </span>
          ))}
        </div>
        <div className="mt-1 text-xs text-stone-400">
          {reviewCount} review{reviewCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Bar distribution */}
      <div className="flex-1 space-y-2">
        {dist.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-3 text-xs">
            <span className="w-4 text-right text-stone-500">{star}</span>
            <span className="text-yellow-400">★</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{
                  width:
                    reviewCount > 0 ? `${(count / reviewCount) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="w-4 text-stone-400">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection({
  reviews,
  ratingAvg,
  reviewCount,
}: {
  reviews: ReviewWithAuthor[];
  ratingAvg: number;
  reviewCount: number;
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-semibold text-ink">
        {reviewCount > 0
          ? `Reviews (${reviewCount})`
          : "No reviews yet"}
      </h2>

      {reviewCount > 0 ? (
        <>
          <RatingSummary
            reviews={reviews}
            ratingAvg={ratingAvg}
            reviewCount={reviewCount}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60 p-8 text-center text-sm text-stone-400">
          Be the first to leave a review after the trip.
        </div>
      )}
    </section>
  );
}
