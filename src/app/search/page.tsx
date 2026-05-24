import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { TripCard } from "@/components/ui/TripCard";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLivePackages, listLiveTrips } from "@/lib/supabase/queries";

export const metadata = {
  title: "Search · Packuptrip",
  description:
    "Search across Packuptrip Originals and Community Trips by destination and date.",
};

type SP = {
  q?: string;
  from?: string;
  to?: string;
  max?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  };

  const [packages, trips] = await Promise.all([
    listLivePackages(filters),
    listLiveTrips(filters),
  ]);

  const totalCount = packages.length + trips.length;
  const summary = sp.q
    ? `“${sp.q}”`
    : "all trips";

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Search results
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {totalCount} {totalCount === 1 ? "trip" : "trips"} for {summary}
          </h1>
          <p className="mt-2 text-stone-600">
            Across Packuptrip Originals and Community Trips.
          </p>
        </section>

        <section className="sticky top-16 z-20 mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <FilterBar
            action="/search"
            accent="amber"
            defaults={{ q: sp.q, from: sp.from, to: sp.to, max: sp.max }}
          />
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
          {totalCount === 0 ? (
            <EmptyState filters={sp} />
          ) : (
            <div className="space-y-16">
              {packages.length > 0 && (
                <ResultsSection
                  badge="originals"
                  badgeLabel="Packuptrip Originals"
                  title={`${packages.length} curated package${packages.length === 1 ? "" : "s"}`}
                  viewAllHref={`/packages?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`}
                  viewAllLabel="See all packages →"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {packages.map((p) => (
                      <PackageCard key={p.id} pkg={p} />
                    ))}
                  </div>
                </ResultsSection>
              )}

              {trips.length > 0 && (
                <ResultsSection
                  badge="community"
                  badgeLabel="Community Trips"
                  title={`${trips.length} community trip${trips.length === 1 ? "" : "s"}`}
                  viewAllHref={`/trips?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`}
                  viewAllLabel="See all community trips →"
                >
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {trips.map((t) => (
                      <TripCard key={t.id} trip={t} />
                    ))}
                  </div>
                </ResultsSection>
              )}

              {packages.length === 0 && trips.length > 0 && (
                <SoftEmpty
                  message="No curated Originals matched - but the community has trips going."
                  variant="amber"
                />
              )}
              {trips.length === 0 && packages.length > 0 && (
                <SoftEmpty
                  message="No community trips matched yet. Want to host one yourself?"
                  variant="teal"
                  cta={{ href: "/host", label: "Host a trip →" }}
                />
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function ResultsSection({
  badge,
  badgeLabel,
  title,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  badge: "originals" | "community";
  badgeLabel: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant={badge}>{badgeLabel}</Badge>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {title}
          </h2>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm font-semibold text-stone-700 hover:text-ink"
        >
          {viewAllLabel}
        </Link>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function EmptyState({ filters }: { filters: SP }) {
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        {hasFilters
          ? "No trips match those filters"
          : "Nothing live right now"}
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
        {hasFilters
          ? "Try widening the date range or removing the destination filter."
          : "Check back soon - new trips go live every week."}
      </p>
      {hasFilters && (
        <Link
          href="/search"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function SoftEmpty({
  message,
  variant,
  cta,
}: {
  message: string;
  variant: "amber" | "teal";
  cta?: { href: string; label: string };
}) {
  const border =
    variant === "amber" ? "border-amber-200" : "border-teal-200";
  const text = variant === "amber" ? "text-amber-800" : "text-teal-800";
  return (
    <div
      className={`rounded-2xl border border-dashed bg-white px-6 py-5 text-sm ${border} ${text}`}
    >
      <span>{message}</span>
      {cta && (
        <Link
          href={cta.href}
          className="ml-3 font-semibold underline-offset-4 hover:underline"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
