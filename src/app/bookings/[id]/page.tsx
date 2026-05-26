import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { formatINR } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { getMyBookingWithItem, getMyReviewForBooking } from "@/lib/supabase/queries";
import { openThread } from "@/actions/messages";
import type { BookedItem } from "@/lib/supabase/queries";
import type { Trip } from "@/types/db";

export const metadata = { title: "Your booking · Packuptrip" };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/bookings/${id}`);

  const res = await getMyBookingWithItem(id);
  if (!res) notFound();
  const { booking, item } = res;

  // Check if user already reviewed this booking
  const existingReview = await getMyReviewForBooking(id, user.id);

  // Is the trip over and within the 14-day review window?
  const startDate = new Date(item.item.start_date);
  const endDate = new Date(startDate.getTime() + item.item.days * 86_400_000);
  const reviewDeadline = new Date(endDate.getTime() + 14 * 86_400_000);
  const now = new Date();
  const tripEnded = now >= endDate;
  const reviewOpen = tripEnded && now <= reviewDeadline && !existingReview &&
    booking.status !== "cancelled" && booking.status !== "refunded";

  const reference = id.slice(0, 8).toUpperCase();
  const accent = item.type === "package" ? "amber" : "teal";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <ConfirmationBanner reference={reference} accent={accent} />

          <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
            <BookingSummary
              variant={item.type === "package" ? "originals" : "community"}
              title={item.item.title}
              location={item.item.location}
              image={item.item.images[0] ?? ""}
              startDate={item.item.start_date}
              days={item.item.days}
              basePrice={Number(booking.base_price)}
              unitLabel={item.type === "package" ? "Per person" : "Per share"}
            />

            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Booking reference
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-ink">
                {reference}
              </div>

              <dl className="mt-5 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
                <Row
                  label="Trip price"
                  value={formatINR(Number(booking.base_price))}
                />
                <Row
                  label="Service fee"
                  value={formatINR(Number(booking.service_fee))}
                />
                <div className="my-1 h-px bg-stone-200" />
                <Row
                  label="Total"
                  value={formatINR(Number(booking.total))}
                  bold
                />
              </dl>

              <div className="mt-5 grid gap-1 text-xs text-stone-500">
                <div>
                  <span className="font-medium text-stone-700">Status:</span>{" "}
                  <StatusChip status={booking.status} />
                </div>
                <div>
                  <span className="font-medium text-stone-700">Booked on:</span>{" "}
                  {new Date(booking.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Link
                  href={
                    item.type === "package"
                      ? `/packages/${item.item.id}`
                      : `/trips/${item.item.id}`
                  }
                  className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  View trip
                </Link>
                <Link
                  href="/account"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-cream hover:bg-stone-700"
                >
                  My bookings
                </Link>
              </div>

              {/* Trip memory — shown after trip starts */}
              {item.type === "trip" && now >= startDate && booking.status !== "cancelled" && booking.status !== "refunded" && (
                <Link
                  href={`/trips/${item.item.id}/memory`}
                  className="mt-3 inline-flex w-full h-11 items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <span>🎒</span>
                  {tripEnded ? "View trip memory" : "Trip memory (in progress)"}
                </Link>
              )}

              {/* Message host — community trips only */}
              {item.type === "trip" && booking.status !== "cancelled" && booking.status !== "refunded" && (
                <form action={openThread} className="mt-3">
                  <input type="hidden" name="hostId" value={(item.item as Trip).host_id} />
                  <input type="hidden" name="tripId" value={item.item.id} />
                  <button
                    type="submit"
                    className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                    </svg>
                    Message host
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/60 p-5 text-sm text-stone-600">
            <p>
              <strong className="text-ink">What happens next.</strong> Your
              spot is reserved. We&rsquo;ll request payment closer to the trip
              date through our payment partner - funds are held until your trip
              begins. You can cancel any time from your account.
            </p>
          </div>

          {reviewOpen && <ReviewPrompt bookingId={id} item={item} reviewDeadline={reviewDeadline} />}
          {existingReview && tripEnded && (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <strong>Review submitted.</strong>{" "}
              {item.type === "trip"
                ? "It will be published once the host also reviews, or in 14 days."
                : "Your review is live on the listing."}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-stone-500">
            Something off about this trip or host?{" "}
            <Link
              href={`/report?type=${item.type === "package" ? "package" : "trip"}&id=${item.item.id}&booking=${booking.id}`}
              className="font-semibold text-red-700 underline-offset-2 hover:text-red-800 hover:underline"
            >
              Report it →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ConfirmationBanner({
  reference,
  accent,
}: {
  reference: string;
  accent: "amber" | "teal";
}) {
  const bg = accent === "amber" ? "bg-amber-50" : "bg-teal-50";
  const ring = accent === "amber" ? "ring-amber-100" : "ring-teal-100";
  const fg = accent === "amber" ? "text-amber-800" : "text-teal-800";
  return (
    <div className={`rounded-2xl p-6 sm:p-8 ring-1 ring-inset ${bg} ${ring}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${fg}`}>
        Spot reserved
      </div>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        You&rsquo;re going!
      </h1>
      <p className="mt-2 max-w-xl text-stone-600">
        Booking reference{" "}
        <span className="font-mono font-semibold text-ink">{reference}</span>.
        Save this - you can also find it on your account page.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-stone-600"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-stone-700"}>
        {value}
      </span>
    </div>
  );
}

function ReviewPrompt({
  bookingId,
  item,
  reviewDeadline,
}: {
  bookingId: string;
  item: BookedItem;
  reviewDeadline: Date;
}) {
  const daysLeft = Math.max(
    0,
    Math.ceil((reviewDeadline.getTime() - Date.now()) / 86_400_000)
  );
  return (
    <div className="mt-6 rounded-2xl bg-amber-50 p-5 ring-1 ring-inset ring-amber-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">
            How was your trip?
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            You have {daysLeft} day{daysLeft !== 1 ? "s" : ""} to leave a review.
          </p>
        </div>
        <Link
          href={`/bookings/${bookingId}/review`}
          className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-600"
        >
          Leave a review
        </Link>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-200 text-stone-700 ring-stone-300",
    refunded: "bg-stone-200 text-stone-700 ring-stone-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
        styles[status] ?? styles.requested
      }`}
    >
      {status}
    </span>
  );
}
