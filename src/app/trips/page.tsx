import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripCard } from "@/components/ui/TripCard";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLiveTrips, getMatchingTripsForUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/db";

export const metadata = {
  title: "Community trips on Packuptrip",
  description:
    "Join a fellow traveller's trip. Browse open community trips by destination, date, and price.",
};

type SP = {
  q?: string;
  from?: string;
  to?: string;
  max?: string;
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const hasFilter = !!(sp.q || sp.from || sp.to || sp.max);

  // Run browsing query and auth check in parallel
  const [trips, supabase] = await Promise.all([
    listLiveTrips({
      q: sp.q || undefined,
      from: sp.from || undefined,
      to: sp.to || undefined,
      maxPrice: sp.max ? Number(sp.max) : undefined,
    }),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  // DNA matches — only on unfiltered browse, only for logged-in users
  let matchedTrips: Trip[] = [];
  if (!hasFilter && user) {
    matchedTrips = await getMatchingTripsForUser(user.id);
    // Exclude IDs that will appear in the main grid so we don't double-show
    const allIds = new Set(trips.map((t) => t.id));
    matchedTrips = matchedTrips.filter((t) => !allIds.has(t.id));
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
          <Badge variant="community">Community Trips</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Find your people
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Open trips posted by other travellers. Join one, split costs, make
            a friend.
          </p>
        </section>

        <section className="sticky top-16 z-20 mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <FilterBar
            action="/trips"
            accent="teal"
            defaults={{ q: sp.q, from: sp.from, to: sp.to, max: sp.max }}
          />
        </section>

        {/* ── DNA Matched strip — only for logged-in users with tags ── */}
        {matchedTrips.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🧬</span>
              <h2 className="text-sm font-semibold text-ink">Matched for your vibe</h2>
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                {matchedTrips.length}
              </span>
            </div>
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {matchedTrips.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
            <div className="mt-5 border-t border-stone-100" />
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
          {trips.length === 0 ? (
            <NoTripsYet hasFilter={hasFilter} />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-stone-500">
                  {hasFilter
                    ? `${trips.length} result${trips.length === 1 ? "" : "s"}`
                    : `All trips (${trips.length})`}
                </span>
                {!user && !hasFilter && (
                  <Link href="/login" className="text-xs font-medium text-teal-700 hover:underline">
                    Sign in to see trips matched to your vibe →
                  </Link>
                )}
              </div>
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {trips.map((t) => (
                  <TripCard key={t.id} trip={t} />
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

function NoTripsYet({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-teal-300 bg-white p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        {hasFilter ? "No trips match your search" : "No community trips yet — be the first to host"}
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
        {hasFilter
          ? "Try a different location, date range, or clear the filters."
          : "Travellers haven't posted any open trips in this window. Got plans? Share them — others will join."}
      </p>
      {!hasFilter && (
        <Link
          href="/host"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          Host a trip →
        </Link>
      )}
    </div>
  );
}
