import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Hosts on Packuptrip",
  description:
    "Real people running real trips. Meet the hosts of Packuptrip.",
};

export const dynamic = "force-dynamic";

type SP = { from?: string; to?: string };

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

/* Split a multi-location trip string ("Alleppey · Varkala · Trivandrum")
 * into its individual places. */
function splitLocation(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[·,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function HostsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // 1. Live trips
  const { data: tripsRaw } = await supabase
    .from("trips")
    .select("host_id, location")
    .eq("status", "live");
  const trips = (tripsRaw ?? []) as { host_id: string; location: string | null }[];

  // 2. Trip data grouped by host
  const tripsByHost = new Map<string, { destinations: Set<string>; count: number }>();
  for (const t of trips) {
    const cur = tripsByHost.get(t.host_id) ?? { destinations: new Set<string>(), count: 0 };
    cur.count += 1;
    splitLocation(t.location).forEach((d) => cur.destinations.add(d));
    tripsByHost.set(t.host_id, cur);
  }

  const hostIds = [...tripsByHost.keys()];

  // 3. Host profiles
  let profiles: Omit<HostRow, "trip_count" | "destinations">[] = [];
  if (hostIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, id_verified, bio, home_city")
      .in("id", hostIds);
    profiles = (data ?? []) as Omit<HostRow, "trip_count" | "destinations">[];
  }

  const allHosts: HostRow[] = profiles.map((p) => {
    const data = tripsByHost.get(p.id) ?? { destinations: new Set<string>(), count: 0 };
    return {
      ...p,
      trip_count: data.count,
      destinations: [...data.destinations].sort(),
    };
  });

  // 4. Build distinct values for filter chips
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

  filteredHosts.sort((a, b) => {
    if (a.id_verified !== b.id_verified) return a.id_verified ? -1 : 1;
    if (a.trip_count !== b.trip_count) return b.trip_count - a.trip_count;
    return a.name.localeCompare(b.name);
  });

  const hasFilter = !!(sp.from || sp.to);

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        {/* ── Hero ── */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
              · The People ·
            </p>
            <h1
              className="mt-4 font-serif font-medium leading-[1.05] tracking-tight text-ink"
              style={{
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              The faces of Packuptrip
            </h1>
            <p className="mt-4 max-w-2xl text-base text-stone-600 sm:text-lg">
              Every trip on Packuptrip is led by someone who&rsquo;s been there.
              Get to know the people who turn ideas into journeys.
            </p>
          </div>
        </section>

        {/* ── Editorial filter row ── */}
        {(allHomeCities.length > 0 || allDestinations.length > 0) && (
          <section className="border-y border-stone-200 bg-white/50">
            <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-6 gap-y-4 px-4 py-5 text-sm text-stone-700 sm:px-6 lg:px-8">
              <SentenceFilter
                lead="From"
                placeholder="anywhere"
                param="from"
                value={sp.from}
                otherParam="to"
                otherValue={sp.to}
                options={allHomeCities}
              />
              <SentenceFilter
                lead="Travelled in"
                placeholder="anywhere"
                param="to"
                value={sp.to}
                otherParam="from"
                otherValue={sp.from}
                options={allDestinations}
              />
              {hasFilter && (
                <Link
                  href="/hosts"
                  className="ml-auto text-xs font-medium text-stone-500 underline-offset-4 hover:text-ink hover:underline"
                >
                  Clear
                </Link>
              )}
            </div>
          </section>
        )}

        {/* ── Results ── */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          {filteredHosts.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {filteredHosts.map((h, i) => (
                <EditorialHostCard key={h.id} host={h} index={i + 1} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ─── Editorial host card ──────────────────────────────────────────────────
 * Magazine-style horizontal spread, alternating photo side on desktop. */

function EditorialHostCard({ host, index }: { host: HostRow; index: number }) {
  const photoOnRight = index % 2 === 0;

  return (
    <Link
      href={`/hosts/${host.id}`}
      className="group block overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        {/* Photo */}
        <div
          className={`relative aspect-[4/5] overflow-hidden bg-stone-100 sm:aspect-auto sm:min-h-[380px] ${
            photoOnRight ? "sm:order-2" : ""
          }`}
        >
          {host.avatar_url ? (
            <Image
              src={host.avatar_url}
              alt={host.name}
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-serif text-8xl text-stone-300">
                {host.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 p-7 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            <span className="font-serif text-base font-medium italic text-stone-400">
              No. {String(index).padStart(2, "0")}
            </span>
            {host.id_verified && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-green-800">✓ Verified host</span>
              </>
            )}
          </div>

          <h2
            className="font-serif font-medium leading-[1.05] tracking-tight text-ink"
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {host.name}
          </h2>

          <div className="text-sm text-stone-500">
            {host.home_city ? (
              <span>Based in {host.home_city}</span>
            ) : (
              <span className="italic text-stone-400">Location private</span>
            )}
          </div>

          {host.bio ? (
            <p className="font-serif text-lg italic leading-relaxed text-stone-700">
              &ldquo;{host.bio}&rdquo;
            </p>
          ) : (
            <p className="text-sm italic leading-relaxed text-stone-400">
              No bio yet — you can read about them on their profile.
            </p>
          )}

          {host.destinations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Trips in:
              </span>
              {host.destinations.slice(0, 5).map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700"
                >
                  {d}
                </span>
              ))}
              {host.destinations.length > 5 && (
                <span className="text-xs text-stone-400">
                  +{host.destinations.length - 5} more
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-5">
            <span className="text-sm text-stone-500">
              {host.trip_count} {host.trip_count === 1 ? "trip" : "trips"} hosted
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-green-800">
              Read more →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Inline-sentence filter ────────────────────────────────────────────────
 * Reads "From [anywhere ▾]" instead of looking like SaaS filter chips. */

function SentenceFilter({
  lead,
  placeholder,
  param,
  value,
  otherParam,
  otherValue,
  options,
}: {
  lead: string;
  placeholder: string;
  param: "from" | "to";
  value: string | undefined;
  otherParam: "from" | "to";
  otherValue: string | undefined;
  options: string[];
}) {
  function makeHref(v: string | null) {
    const p = new URLSearchParams();
    if (otherValue) p.set(otherParam, otherValue);
    if (v) p.set(param, v);
    const qs = p.toString();
    return qs ? `/hosts?${qs}` : "/hosts";
  }

  return (
    <div className="group relative">
      <span className="text-stone-500">{lead}</span>{" "}
      <span className="font-serif text-base italic text-ink underline decoration-stone-300 underline-offset-4 transition-colors group-hover:decoration-ink">
        {value ?? placeholder}
      </span>
      <span className="ml-0.5 text-stone-400">▾</span>

      {/* Dropdown — pure-CSS hover/focus reveal */}
      <div className="invisible absolute left-0 top-full z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl bg-white p-2 opacity-0 shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-stone-200 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <Link
          href={makeHref(null)}
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            !value ? "bg-stone-100 font-medium text-ink" : "text-stone-700 hover:bg-stone-50"
          }`}
        >
          Anywhere
        </Link>
        {options.map((opt) => (
          <Link
            key={opt}
            href={makeHref(opt)}
            className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
              value === opt ? "bg-stone-100 font-medium text-ink" : "text-stone-700 hover:bg-stone-50"
            }`}
          >
            {opt}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────────── */

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="font-serif text-3xl italic text-stone-400">
        {hasFilter ? "No match." : "Quiet here, for now."}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">
        {hasFilter
          ? "Try removing a filter, or picking a different place."
          : "Our first hosts are just settling in. Check back soon — or be the one who starts it."}
      </p>
      <Link
        href={hasFilter ? "/hosts" : "/host"}
        className="mt-7 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
      >
        {hasFilter ? "Clear filters" : "Host a trip →"}
      </Link>
    </div>
  );
}
