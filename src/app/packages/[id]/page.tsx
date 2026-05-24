import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DetailHero } from "@/components/detail/DetailHero";
import { Itinerary } from "@/components/detail/Itinerary";
import { Inclusions } from "@/components/detail/Inclusions";
import { PriceCard } from "@/components/detail/PriceCard";
import { StickyBookBar } from "@/components/detail/StickyBookBar";
import { getLivePackage } from "@/lib/supabase/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getLivePackage(id);
  if (!pkg) return { title: "Package not found · Packuptrip" };
  return {
    title: `${pkg.title} · Packuptrip Originals`,
    description: pkg.description?.slice(0, 160) ?? undefined,
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getLivePackage(id);
  if (!pkg) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream">
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
          <div className="min-w-0 space-y-12">
            {pkg.description && (
              <section>
                <p className="max-w-2xl text-base leading-relaxed text-stone-700">
                  {pkg.description}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-xl font-semibold text-ink">What's included</h2>
              <div className="mt-4">
                <Inclusions items={pkg.includes} />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-ink">Day-by-day</h2>
              <div className="mt-6">
                <Itinerary days={pkg.itinerary} accent="amber" />
              </div>
            </section>

            {pkg.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-ink">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {pkg.tags.map((t) => (
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
