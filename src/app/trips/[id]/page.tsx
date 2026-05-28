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
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getLiveTrip(id);
  if (!res) return { title: "Trip not found · Packuptrip" };
  const image = res.trip.images[0];
  return {
    title: `${res.trip.title} · Community trip`,
    description: res.trip.description?.slice(0, 160) ?? undefined,
    openGraph: image ? {
      images: [{ url: image, width: 1200, height: 630, alt: res.trip.title }],
    } : undefined,
    twitter: image ? { card: "summary_large_image" as const, images: [image] } : undefined,
  };
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [res, reviews] = await Promise.all([
    getLiveTrip(id),
    getListingReviews("trip", id),
  ]);
  if (!res) notFound();
  const { trip, host } = res;

  // Check if current user is a trip member (for group chat button)
  let isMember = false;
  if (user) {
    if (user.id === host?.id) {
      isMember = true;
    } else {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("item_id", id)
        .eq("item_type", "trip")
        .eq("user_id", user.id)
        .in("status", ["requested", "confirmed"]);
      isMember = (count ?? 0) > 0;
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <DetailHero
          images={trip.images}
          title={trip.title}
          location={trip.location}
          variant="community"
          backHref="/trips"
          backLabel="All community trips"
        />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-12 lg:px-8 lg:py-16">
          <div className="min-w-0 space-y-14">
            {host && <HostCard host={host} currentUserId={user?.id} />}

            {trip.description && (
              <section>
                <SectionLabel eyebrow="About this trip" title="What you're signing up for" />
                <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-stone-700 sm:text-xl sm:leading-[1.65]">
                  {trip.description}
                </p>
                {trip.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {trip.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <SectionLabel eyebrow="Included" title="What's covered" />
              <div className="mt-6">
                <Inclusions items={trip.includes} />
              </div>
            </section>

            <section>
              <SectionLabel eyebrow="The plan" title="Day by day" />
              <div className="mt-7">
                <Itinerary days={trip.itinerary} accent="teal" />
              </div>
            </section>

            <ReportLink subjectType="trip" subjectId={trip.id} />
          </div>

          <aside id="price-card" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
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
            {/* Group chat — visible to host and joiners only */}
            {isMember && (
              <Link
                href={`/trips/${trip.id}/chat`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-100"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                  <circle cx="5" cy="7" r="0.75" fill="currentColor"/>
                  <circle cx="8" cy="7" r="0.75" fill="currentColor"/>
                  <circle cx="11" cy="7" r="0.75" fill="currentColor"/>
                </svg>
                Trip group chat
              </Link>
            )}
            {/* Memory page — unlocks once trip has started */}
            {isMember && new Date() >= new Date(trip.start_date) && (
              <Link
                href={`/trips/${trip.id}/memory`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-500 transition hover:bg-yellow-100"
              >
                🎒 Trip memory
              </Link>
            )}
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

function SectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
        {eyebrow}
      </p>
      <h2
        className="mt-2 font-serif font-medium leading-tight text-ink"
        style={{
          fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
          fontVariationSettings: "'opsz' 144",
        }}
      >
        {title}
      </h2>
    </div>
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

function SuperhostBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400">
      ⭐ Superhost
    </span>
  );
}

function HostCard({
  host,
  currentUserId,
}: {
  host: Profile;
  currentUserId?: string;
}) {
  const canMessage = currentUserId && currentUserId !== host.id;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <Link
        href={`/hosts/${host.id}`}
        className="group flex items-center gap-4"
      >
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-green-100 ring-2 ring-white">
          {host.avatar_url ? (
            <Image
              src={host.avatar_url}
              alt={host.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-base font-semibold text-green-900">
              {host.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-green-800">
            Your host
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-base font-semibold text-ink group-hover:text-green-800 transition-colors">
            {host.name}
            {host.id_verified && <VerifiedBadge size="md" />}
            {host.host_tier === "superhost" && <SuperhostBadge />}
          </div>
          <div className="text-xs text-stone-500">
            {host.id_verified ? "ID verified · " : ""}
            <span className="text-green-700">View profile →</span>
          </div>
        </div>
      </Link>

      {canMessage && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <Link
            href={`/messages?hostId=${host.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-500"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path d="M13 1H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3l2.5 3L10 10h3a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Message {host.name.split(" ")[0]}
          </Link>
        </div>
      )}
    </div>
  );
}
