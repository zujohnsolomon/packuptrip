import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripCard } from "@/components/ui/TripCard";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLiveTrips, getMatchingTripsForUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/db";

export const metadata = {
  title: "Community trips · Packuptrip",
  description:
    "Real travellers, real plans. Join an open trip — split costs, make a friend.",
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
      <main className="flex-1 bg-stone-50 pt-20">
        {/* ── Editorial hero ── */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-800">
              · Community ·
            </p>
            <h1
              className="mt-4 font-serif font-medium leading-[1.05] tracking-tight text-ink"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Real travellers, real plans.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-stone-600 sm:text-lg">
              Someone&rsquo;s already going where you want to go. Join their
              trip, split the costs, make a friend.
            </p>
          </div>
        </section>

        {/* ── Filter bar ── */}
        <section className="sticky top-16 z-20 border-y border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <FilterBar
              action="/trips"
              accent="teal"
              defaults={{ q: sp.q, from: sp.from, to: sp.to, max: sp.max }}
            />
          </div>
        </section>

        {/* ── DNA Matched strip — only for logged-in users with tags ── */}
        {matchedTrips.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-baseline gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-800">
                Matched for your vibe
              </p>
              <span className="text-xs text-stone-400">
                · {matchedTrips.length} pick{matchedTrips.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {matchedTrips.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
            <div className="mt-10 border-t border-stone-100" />
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {trips.length === 0 ? (
            <NoTripsYet hasFilter={hasFilter} />
          ) : (
            <>
              {hasFilter && (
                <p className="mb-6 font-serif text-base italic text-stone-500">
                  {trips.length} {trips.length === 1 ? "trip" : "trips"} matching your search
                </p>
              )}
              {!user && !hasFilter && (
                <div className="mb-6 flex items-center justify-end">
                  <Link href="/login" className="text-xs font-medium text-green-800 underline-offset-4 hover:underline">
                    Sign in to see trips matched to your vibe →
                  </Link>
                </div>
              )}
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
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="font-serif text-3xl italic text-stone-400">
        {hasFilter ? "No match." : "Be the first."}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">
        {hasFilter
          ? "Try a different place, broaden the dates, or clear the filters."
          : "No open community trips for this window yet. Got plans of your own? Share them — others will join."}
      </p>
      <Link
        href={hasFilter ? "/trips" : "/host"}
        className="mt-7 inline-flex h-10 items-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
      >
        {hasFilter ? "Clear filters" : "Host a trip →"}
      </Link>
    </div>
  );
}
