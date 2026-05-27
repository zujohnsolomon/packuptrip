import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLivePackages } from "@/lib/supabase/queries";

export const metadata = {
  title: "Packuptrip Originals · Curated journeys",
  description:
    "Hand-crafted tours with vetted local guides. Fixed dates, small groups, real itineraries.",
};

type SP = {
  q?: string;
  from?: string;
  to?: string;
  max?: string;
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const packages = await listLivePackages({
    q: sp.q || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  });

  const hasFilter = !!(sp.q || sp.from || sp.to || sp.max);

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        {/* ── Editorial hero ── */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-500">
              · Originals ·
            </p>
            <h1
              className="mt-4 font-serif font-medium leading-[1.05] tracking-tight text-ink"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Curated journeys, run by us.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-stone-600 sm:text-lg">
              Fixed departures, vetted local guides, small groups.
              The kind of trip you&rsquo;d book if a friend planned it for you.
            </p>
          </div>
        </section>

        {/* ── Filter bar ── */}
        <section className="sticky top-16 z-20 border-y border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <FilterBar
              action="/packages"
              accent="amber"
              defaults={{ q: sp.q, from: sp.from, to: sp.to, max: sp.max }}
            />
          </div>
        </section>

        {/* ── Results ── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {packages.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <>
              {hasFilter && (
                <p className="mb-6 font-serif text-base italic text-stone-500">
                  {packages.length} {packages.length === 1 ? "journey" : "journeys"} matching your search
                </p>
              )}
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packages.map((p) => (
                  <PackageCard key={p.id} pkg={p} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="font-serif text-3xl italic text-stone-400">
        {hasFilter ? "Nothing matches, yet." : "Quiet season, for now."}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">
        {hasFilter
          ? "Try widening the dates, removing the price cap, or clearing where."
          : "Our next departures are being curated. Check back soon, or join a community trip in the meantime."}
      </p>
      <Link
        href={hasFilter ? "/packages" : "/trips"}
        className="mt-7 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
      >
        {hasFilter ? "Clear filters" : "Browse community trips →"}
      </Link>
    </div>
  );
}
