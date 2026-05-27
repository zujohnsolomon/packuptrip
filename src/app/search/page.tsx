import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { TripCard, type TripCardHost } from "@/components/ui/TripCard";
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

  const supabase = await createClient();
  const [packages, trips] = await Promise.all([
    listLivePackages(filters),
    listLiveTrips(filters),
  ]);

  // Fetch host profiles for trip cards
  const hostIds = [...new Set(trips.map((t) => t.host_id))];
  const hostMap = new Map<string, TripCardHost>();
  if (hostIds.length > 0) {
    const { data: hosts } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, id_verified")
      .in("id", hostIds);
    for (const h of hosts ?? []) {
      hostMap.set(h.id, {
        name: h.name,
        avatar: h.avatar_url,
        idVerified: h.id_verified,
      });
    }
  }

  const totalCount = packages.length + trips.length;
  const summary = sp.q ? `"${sp.q}"` : "all destinations";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Search results
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {totalCount} {totalCount === 1 ? "trip" : "trips"} for {summary}
          </h1>
          <p className="mt-1 text-stone-500">
            Across Packuptrip Originals and Community Trips.
          </p>
        </section>

        <section className="sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b border-stone-100 mx-auto max-w-7xl px-4 pb-3 pt-2 sm:px-6 lg:px-8">
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
                  viewAllHref={`/packages?${new URLSearchParams(
                    Object.entries(sp).filter(([, v]) => v) as [string, string][]
                  ).toString()}`}
                  viewAllLabel="See all packages →"
                >
                  <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  viewAllHref={`/trips?${new URLSearchParams(
                    Object.entries(sp).filter(([, v]) => v) as [string, string][]
                  ).toString()}`}
                  viewAllLabel="See all community trips →"
                >
                  <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {trips.map((t) => (
                      <TripCard key={t.id} trip={t} host={hostMap.get(t.host_id)} />
                    ))}
                  </div>
                </ResultsSection>
              )}

              {packages.length === 0 && trips.length > 0 && (
                <SoftEmpty
                  message="No curated Originals matched — but the community has trips going."
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
          className="text-sm font-semibold text-stone-500 hover:text-ink transition-colors"
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
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        {hasFilters ? "No trips match those filters" : "Nothing live right now"}
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
        {hasFilters
          ? "Try widening the date range or removing the destination filter."
          : "Check back soon — new trips go live every week."}
      </p>
      {hasFilters && (
        <Link
          href="/search"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
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
  const cls =
    variant === "amber"
      ? "border-amber-200 text-amber-800 bg-amber-50/60"
      : "border-green-200 text-green-900 bg-green-50/60";
  return (
    <div className={`rounded-2xl border px-6 py-4 text-sm ${cls}`}>
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
