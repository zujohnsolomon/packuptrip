import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DetailHero } from "@/components/detail/DetailHero";
import { Itinerary } from "@/components/detail/Itinerary";
import { Inclusions } from "@/components/detail/Inclusions";
import { PriceCard } from "@/components/detail/PriceCard";
import { StickyBookBar } from "@/components/detail/StickyBookBar";
import { getLivePackage, getListingReviews } from "@/lib/supabase/queries";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getLivePackage(id);
  if (!pkg) return { title: "Package not found · Packuptrip" };
  const image = pkg.images[0];
  return {
    title: `${pkg.title} · Packuptrip Originals`,
    description: pkg.description?.slice(0, 160) ?? undefined,
    openGraph: image ? {
      images: [{ url: image, width: 1200, height: 630, alt: pkg.title }],
    } : undefined,
    twitter: image ? { card: "summary_large_image" as const, images: [image] } : undefined,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, reviews] = await Promise.all([
    getLivePackage(id),
    getListingReviews("package", id),
  ]);
  if (!pkg) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <DetailHero
          images={pkg.images}
          title={pkg.title}
          location={pkg.location}
          variant="originals"
          backHref="/packages"
          backLabel="All packages"
        />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-12 lg:px-8 lg:py-16">
          {/* Left: content */}
          <div className="min-w-0 space-y-14">
            {pkg.description && (
              <section>
                <SectionLabel eyebrow="About this journey" title="What you're booking" />
                <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-stone-700 sm:text-xl sm:leading-[1.65]">
                  {pkg.description}
                </p>
                {pkg.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {pkg.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600 ring-1 ring-inset ring-yellow-100"
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
                <Inclusions items={pkg.includes} />
              </div>
            </section>

            <section>
              <SectionLabel eyebrow="The plan" title="Day by day" />
              <div className="mt-7">
                <Itinerary days={pkg.itinerary} accent="amber" />
              </div>
            </section>

            <section>
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-4 text-sm text-stone-600">
                Something off about this package?{" "}
                <Link
                  href={`/report?type=package&id=${pkg.id}`}
                  className="font-semibold text-red-700 underline-offset-2 hover:text-red-800 hover:underline"
                >
                  Report it →
                </Link>
              </div>
            </section>
          </div>

          {/* Right: sticky price card */}
          <aside id="price-card" className="lg:sticky lg:top-24 lg:self-start">
            <PriceCard
              basePrice={Number(pkg.price)}
              unitLabel="per person"
              ctaLabel="Book this trip"
              ctaHref={`/book/package/${pkg.id}`}
              spotsLeft={pkg.spots_left}
              spotsTotal={pkg.spots_total}
              accent="amber"
              startDate={pkg.start_date}
              days={pkg.days}
            />
          </aside>
        </div>

        {/* Reviews */}
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <ReviewsSection
            reviews={reviews}
            ratingAvg={pkg.rating_avg ?? 0}
            reviewCount={pkg.review_count ?? 0}
          />
        </div>

        <StickyBookBar
          basePrice={Number(pkg.price)}
          ctaLabel="Book this trip"
          ctaHref={`/book/package/${pkg.id}`}
          spotsLeft={pkg.spots_left}
          accent="amber"
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
