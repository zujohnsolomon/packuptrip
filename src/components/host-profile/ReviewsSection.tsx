import Image from "next/image";
import type { ReviewWithAuthor } from "./types";
import { SectionLabel } from "./icons";
import { trimText } from "./utils";

function RatingBox({ rating, count }: { rating: number | null; count: number }) {
  const full = Math.round(rating ?? 0);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white p-5 text-center shadow-sm">
      <div className="font-serif text-[48px] font-semibold leading-none text-[#17120f]">
        {rating?.toFixed(1) ?? "—"}
      </div>
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i < full ? "#1f1b17" : "#d6d3d1"}
            />
          </svg>
        ))}
      </div>
      <p className="mt-2 text-[11px] font-semibold text-stone-500">
        ({count} {count === 1 ? "review" : "reviews"})
      </p>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-[#f3f1ec] p-5">
      <blockquote className="text-[13px] font-semibold leading-6 text-stone-700">
        &ldquo;{trimText(review.text ?? "A thoughtful journey.", 120)}&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center gap-3">
        <span className="relative h-7 w-7 overflow-hidden rounded-full bg-stone-200">
          {review.author.avatar_url ? (
            <Image src={review.author.avatar_url} alt={review.author.name} fill unoptimized sizes="28px" className="object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[10px] font-bold text-stone-500">
              {review.author.name.charAt(0).toUpperCase()}
            </span>
          )}
        </span>
        <span className="text-[12px] leading-tight">
          <strong className="block text-[#17120f]">{review.author.name}</strong>
        </span>
      </div>
    </div>
  );
}

function PlaceholderReview({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-[#f3f1ec] p-5">
      <blockquote className="text-[13px] font-semibold leading-6 text-stone-500">
        &ldquo;{text}&rdquo;
      </blockquote>
    </div>
  );
}

type ReviewsSectionProps = {
  reviews: ReviewWithAuthor[];
  avgRating: number | null;
};

export function HostReviewsSection({ reviews, avgRating }: ReviewsSectionProps) {
  return (
    <article id="reviews" className="scroll-mt-28 border-t border-stone-200 pt-8">
      <div className="mb-5 flex items-center justify-between">
        <SectionLabel>Traveler reviews</SectionLabel>
        {reviews.length > 2 && (
          <span className="text-[12px] font-semibold text-stone-500">View all &rsaquo;</span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <RatingBox rating={avgRating} count={reviews.length} />
        {reviews.length > 0 ? (
          reviews.slice(0, 2).map((r) => <ReviewCard key={r.id} review={r} />)
        ) : (
          <>
            <PlaceholderReview text="Reviews will appear here after completed trips." />
            <PlaceholderReview text="Only travellers who joined a real trip can leave a review." />
          </>
        )}
      </div>
    </article>
  );
}
