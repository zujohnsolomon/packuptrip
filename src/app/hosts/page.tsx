import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Hosts on Packuptrip",
  description:
    "Meet the travellers running trips on Packuptrip. Filter by where they're from and where they've travelled.",
};

type SP = {
  from?: string; // host's home city
  to?: string;   // trip destination
};

type HostRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  id_verified: boolean;
  bio: string | null;
  home_city: string | null;
  trip_count: number;
  destinations: string[];
};

export default async function HostsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // 1. All hosts who have ever hosted a non-archived trip
  const { data: tripsRaw } = await supabase
    .from("trips")
    .select("host_id, location, status")
    .neq("status", "archived");

  const trips = (tripsRaw ?? []) as { host_id: string; location: string | null; status: string }[];

  // Group trips by host
  const tripsByHost = new Map<string, { location: string | null; live: boolean }[]>();
  for (const t of trips) {
    const list = tripsByHost.get(t.host_id) ?? [];
    list.push({ location: t.location, live: t.status === "live" });
    tripsByHost.set(t.host_id, list);
  }

  const hostIds = [...tripsByHost.keys()];

  // 2. Profile data for each host
  const { data: profilesRaw } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, id_verified, bio, home_city")
    .in("id", hostIds.length > 0 ? hostIds : ["00000000-0000-0000-0000-000000000000"]);

  const profiles = (profilesRaw ?? []) as Omit<HostRow, "trip_count" | "destinations">[];

  // 3. Build the rows
  const allHosts: HostRow[] = profiles.map((p) => {
    const hostTrips = tripsByHost.get(p.id) ?? [];
    const destinations = [
      ...new Set(hostTrips.map((t) => t.location).filter((l): l is string => !!l)),
    ].sort();
    return {
      ...p,
      trip_count: hostTrips.filter((t) => t.live).length,
      destinations,
    };
  });

  // 4. Build filter chip lists (all distinct values)
  const allHomeCities = [
    ...new Set(allHosts.map((h) => h.home_city).filter((c): c is string => !!c)),
  ].sort();
  const allDestinations = [
    ...new Set(allHosts.flatMap((h) => h.destinations)),
  ].sort();

  // 5. Apply filters
  const filteredHosts = allHosts.filter((h) => {
    if (sp.from && h.home_city !== sp.from) return false;
    if (sp.to && !h.destinations.includes(sp.to)) return false;
    return true;
  });

  // Sort: verified first, then by trip count desc, then alpha
  filteredHosts.sort((a, b) => {
    if (a.id_verified !== b.id_verified) return a.id_verified ? -1 : 1;
    if (a.trip_count !== b.trip_count) return b.trip_count - a.trip_count;
    return a.name.localeCompare(b.name);
  });

  const hasFilter = !!(sp.from || sp.to);

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 lg:px-8">
          <Badge variant="community">Hosts</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Meet the people behind the trips
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Every Packuptrip host has been there. Find someone who travels like
            you do — or knows the place you want to go.
          </p>
        </section>

        {/* Filters */}
        <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="space-y-4 rounded-2xl bg-stone-50 p-5 ring-1 ring-inset ring-stone-100">
            <FilterRow
              label="Where they're from"
              param="from"
              options={allHomeCities}
              currentValue={sp.from}
              otherParam="to"
              otherValue={sp.to}
            />
            <FilterRow
              label="Where they've travelled"
              param="to"
              options={allDestinations}
              currentValue={sp.to}
              otherParam="from"
              otherValue={sp.from}
            />
            {hasFilter && (
              <div className="pt-1">
                <Link
                  href="/hosts"
                  className="text-xs font-medium text-stone-500 underline-offset-4 hover:text-ink hover:underline"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8">
          {filteredHosts.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <>
              <p className="mb-4 text-sm text-stone-500">
                {hasFilter
                  ? `${filteredHosts.length} host${filteredHosts.length === 1 ? "" : "s"} match your filters`
                  : `${filteredHosts.length} host${filteredHosts.length === 1 ? "" : "s"}`}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {filteredHosts.map((h) => (
                  <HostTile key={h.id} host={h} />
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

/* ── Filter chip row ───────────────────────────────────────────────────────── */

function FilterRow({
  label,
  param,
  options,
  currentValue,
  otherParam,
  otherValue,
}: {
  label: string;
  param: "from" | "to";
  options: string[];
  currentValue: string | undefined;
  otherParam: "from" | "to";
  otherValue: string | undefined;
}) {
  if (options.length === 0) return null;

  function chipHref(value: string | null) {
    const params = new URLSearchParams();
    if (otherValue) params.set(otherParam, otherValue);
    if (value) params.set(param, value);
    const qs = params.toString();
    return qs ? `/hosts?${qs}` : "/hosts";
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <Chip href={chipHref(null)} active={!currentValue}>
          All
        </Chip>
        {options.map((opt) => (
          <Chip key={opt} href={chipHref(opt)} active={currentValue === opt}>
            {opt}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-ink text-white"
          : "bg-white text-stone-600 ring-1 ring-inset ring-stone-200 hover:bg-stone-100 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/* ── Host portrait tile ───────────────────────────────────────────────────── */

function HostTile({ host }: { host: HostRow }) {
  return (
    <Link
      href={`/hosts/${host.id}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-stone-100 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1"
    >
      {host.avatar_url ? (
        <Image
          src={host.avatar_url}
          alt={host.name}
          fill
          sizes="(max-width: 640px) 50vw, 260px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-5xl font-bold text-stone-300">
            {host.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      {/* Verified badge */}
      {host.id_verified && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
          ✓ Verified
        </span>
      )}

      {/* Name + meta overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold leading-tight text-white sm:text-base">
          {host.name}
        </p>
        <p className="mt-0.5 text-[11px] text-white/80">
          {host.home_city ? `${host.home_city} · ` : ""}
          {host.trip_count} {host.trip_count === 1 ? "trip" : "trips"}
        </p>
      </div>
    </Link>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        {hasFilter ? "No hosts match these filters" : "No hosts yet"}
      </div>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
        {hasFilter
          ? "Try removing a filter or picking a different city."
          : "Once travellers start hosting trips, they'll show up here."}
      </p>
      {hasFilter && (
        <Link
          href="/hosts"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
