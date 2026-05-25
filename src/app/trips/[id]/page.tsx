import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DetailHero } from "@/components/detail/DetailHero";
import { Itinerary } from "@/components/detail/Itinerary";
import { Inclusions } from "@/components/detail/Inclusions";
import { PriceCard } from "@/components/detail/PriceCard";
import { StickyBookBar } from "@/components/detail/StickyBookBar";
import { getLiveTrip, getListingReviews } from "@/lib/supabase/queries";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import type { Profile } from "@/types/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getLiveTrip(id);
  if (!res) return { title: "Trip not found · Packuptrip" };
  return {
    title: `${res.trip.title} · Community trip`,
    description: res.trip.description?.slice(0, 160) ?? undefined,
  };
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [res, reviews] = await Promise.all([
    getLiveTrip(id),
    getListingReviews("trip", id),
  ]);
  if (!res) notFound();
  const { trip, host } = res;

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
        <DetailHero
          images={trip.images}
          title={trip.title}
          location={trip.location}
          variant="community"
          backHref="/trips"
          backLabel="All community trips"
        />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-12 lg:px-8 lg:py-16">
          <div className="min-w-0 space-y-12">
            {host && <HostCard host={host} />}

            {trip.description && (
              <section>
                <p className="max-w-2xl text-base leading-relaxed text-stone-700">
                  {trip.description}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-xl font-semibold text-ink">What's included</h2>
              <div className="mt-4">
                <Inclusions items={trip.includes} />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">Day-by-day</h2>
              <div className="mt-6">
                <Itinerary days={trip.itinerary} accent="teal" />
              </div>
            </section>

            {trip.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-ink">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trip.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <ReportLink subjectType="trip" subjectId={trip.id} />
          </div>

          <aside id="price-card" className="lg:sticky lg:top-24 lg:self-start">
            <PriceCard
              basePrice={Number(trip.price_per_share)}
              unitLabel="per share"
              ctaLabel="Join this trip"
              ctaHref={`/book/trip/${trip.id}`}
              spotsLeft={trip.spots_left}
              spotsTotal={trip.spots_total}
              accent="teal"
              startDate={trip.start_date}
              days={trip.days}
            />
          </aside>
        </div>

        {/* Reviews */}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <ReviewsSection
            reviews={reviews}
            ratingAvg={trip.rating_avg ?? 0}
            reviewCount={trip.review_count ?? 0}
          />
        </div>

        <StickyBookBar
          basePrice={Number(trip.price_per_share)}
          ctaLabel="Join this trip"
          ctaHref={`/book/trip/${trip.id}`}
          spotsLeft={trip.spots_left}
          accent="teal"
        />
      </main>
      <Footer />
    </>
  );
}

function ReportLink({
  subjectType,
  subjectId,
}: {
  subjectType: "user" | "trip" | "package";
  subjectId: string;
}) {
  const href = `/report?type=${subjectType}&id=${subjectId}`;
  return (
    <section>
      <div className="rounded-2xl border border-stone-200 bg-white/60 p-4 text-sm text-stone-600">
        Something off about this trip?{" "}
        <Link
          href={href}
          className="font-semibold text-red-700 underline-offset-2 hover:text-red-800 hover:underline"
        >
          Report it →
        </Link>
      </div>
    </section>
  );
}

function HostCard({ host }: { host: Profile }) {
  return (
    <section className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-white">
        {host.avatar_url ? (
          <Image
            src={host.avatar_url}
            alt={host.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-base font-semibold text-teal-800">
            {host.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Your host
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-base font-semibold text-ink">
          {host.name}
          {host.id_verified && <VerifiedBadge size="md" />}
        </div>
        <div className="text-xs text-stone-500">
          {host.id_verified ? "ID verified" : "Unverified host"}
        </div>
      </div>
    </section>
  );
}
