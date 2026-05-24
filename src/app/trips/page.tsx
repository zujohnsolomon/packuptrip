import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripCard } from "@/components/ui/TripCard";
import { Badge } from "@/components/ui/Badge";
import { FilterBar } from "@/components/browse/FilterBar";
import { listLiveTrips } from "@/lib/supabase/queries";

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
  const trips = await listLiveTrips({
    q: sp.q || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
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

        <section className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
          {trips.length === 0 ? (
            <NoTripsYet />
          ) : (
            <>
              <div className="mb-4 text-sm text-stone-500">
                Showing {trips.length} trip{trips.length === 1 ? "" : "s"}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

function NoTripsYet() {
  return (
    <div className="rounded-2xl border border-dashed border-teal-300 bg-white p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        No community trips yet - be the first to host
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
        Travellers haven&rsquo;t posted any open trips in this window. Got
        plans? Share them - others will join.
      </p>
      <Link
        href="/host"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-teal-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        Host a trip →
      </Link>
    </div>
  );
}
