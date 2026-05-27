import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { TripCard, type TripCardHost } from "@/components/ui/TripCard";
import { Badge } from "@/components/ui/Badge";
import { DestinationPicker } from "@/components/ui/DestinationPicker";
import { MonthPicker } from "@/components/ui/MonthPicker";
import { createClient } from "@/lib/supabase/server";
import { listLiveTrips, listLivePackages, listFeaturedPackages } from "@/lib/supabase/queries";
import { engineImages, heroImage, testimonials } from "@/lib/seed-data";
import type { Trip, Package } from "@/types/db";

export default async function Home() {
  const supabase = await createClient();

  // Fetch real data in parallel
  const [trips, packages, featuredPackages] = await Promise.all([
    listLiveTrips(),
    listLivePackages(),
    listFeaturedPackages(),
  ]);

  const featuredTrips = trips.slice(0, 4);

  // Host profiles for trip cards
  const hostIds = [...new Set(featuredTrips.map((t) => t.host_id))];
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

  // Featured hosts — unique hosts from live trips + their trip counts
  const allHostIds = [...new Set(trips.map((t) => t.host_id))].slice(0, 8);
  let featuredHosts: { id: string; name: string; avatar_url: string | null; id_verified: boolean }[] = [];
  if (allHostIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, id_verified")
      .in("id", allHostIds)
      .not("avatar_url", "is", null);
    featuredHosts = (data ?? []).slice(0, 8);
  }

  // Trip count per host (from already-fetched trips)
  const tripCounts = new Map<string, number>();
  for (const t of trips) {
    tripCounts.set(t.host_id, (tripCounts.get(t.host_id) ?? 0) + 1);
  }

  return (
    <>
      <Header overlay />
      <main className="flex-1">
        <Hero featuredPackages={featuredPackages} />
        <SocialProofBar />
        <TwoEngines />
        <ExploreDestinations />
        <FeaturedPackages packages={featuredPackages} />
        <TravelCategories />
        <FeaturedTrips trips={featuredTrips} hostMap={hostMap} />
        {featuredHosts.length > 0 && (
          <FeaturedHosts hosts={featuredHosts} tripCounts={tripCounts} />
        )}
        <HowItWorks />
        <TrustAndSafety />
        <Testimonials />
        <HostCTA />
      </main>
      <Footer />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero - full-bleed photo, headline, search. Premium typography, clear UX.   */
/* -------------------------------------------------------------------------- */

function Hero({ featuredPackages }: { featuredPackages: import("@/types/db").Package[] }) {
  return (
    <section className="relative isolate flex min-h-[85vh] w-full items-center overflow-hidden">
      <Image
        src={heroImage}
        alt="Travellers on a mountain ridge at golden hour"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-36 lg:px-8 lg:pb-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur">
            Two ways to travel, one community
          </span>

          <h1
            className="mt-5 font-serif font-medium leading-[1.02] tracking-tight text-white"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.75rem)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 100",
            }}
          >
            Find your trip,
            <br />
            or find your people.
          </h1>

          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Book a curated tour with Packuptrip Originals, or join a fellow
            traveller&rsquo;s journey. Either way, you&rsquo;ll never travel
            alone.
          </p>

          <div className="mt-8">
            <SearchBar />
          </div>

          <TrustStrip />
        </div>

        {/* Featured strip — real packages from DB */}
        {featuredPackages.length > 0 && (
          <FeaturedStrip packages={featuredPackages} />
        )}
      </div>
    </section>
  );
}

function SearchBar() {
  return (
    <form
      action="/search"
      className="w-full max-w-2xl"
    >
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow-search)] sm:flex-row sm:items-stretch">
        <DestinationPicker />

        <div className="hidden w-px self-stretch bg-stone-200 sm:block" />

        <MonthPicker />

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-yellow-700 sm:h-auto sm:w-auto sm:shrink-0 sm:px-7"
        >
          <SearchIcon />
          Search
        </button>
      </div>
      {/* Hint: search returns both Originals and Community trips */}
      <div className="mt-2 px-1 text-xs text-white/70">
        Searches both Packuptrip Originals and Community Trips.
      </div>
    </form>
  );
}

function TrustStrip() {
  const items = ["Verified hosts", "Secure payments", "2-way reviews"];
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
      {items.map((label) => (
        <span key={label} className="inline-flex items-center gap-2">
          <CheckIcon /> {label}
        </span>
      ))}
    </div>
  );
}

/* Featured packages strip — populated from DB, admin-controlled.
 * Each tile links directly to that package's detail page. */
function FeaturedStrip({ packages }: { packages: import("@/types/db").Package[] }) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
          Open right now
        </span>
        <Link
          href="/packages"
          className="text-xs font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/packages/${pkg.id}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/15 transition-transform hover:-translate-y-1"
          >
            {pkg.images[0] && (
              <Image
                src={pkg.images[0]}
                alt={pkg.title}
                fill
                sizes="(max-width: 640px) 50vw, 220px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="font-serif text-base font-medium leading-tight text-white sm:text-lg">
                {pkg.title}
              </div>
              <div className="mt-0.5 text-[11px] text-white/80">{pkg.location}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Social Proof Bar — slim trust strip below hero                             */
/* -------------------------------------------------------------------------- */

function SocialProofBar() {
  const items = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
      label: "ID-verified hosts",
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      label: "Secure payments",
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      label: "2-way reviews",
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: "Real travellers, real trips",
    },
  ];

  return (
    <section className="border-b border-stone-100 bg-white">
      <div className="overflow-x-auto scrollbar-none">
        <div className="mx-auto flex w-max min-w-full items-center justify-start gap-6 px-5 py-4 sm:justify-center sm:gap-10 sm:px-6">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-stone-600"
            >
              <span className="text-green-700">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Two engines (with photos)                                                  */
/* -------------------------------------------------------------------------- */

function TwoEngines() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="How Packuptrip works"
          title="Two engines, one community"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <EngineCard
            variant="originals"
            eyebrow="Packuptrip Originals"
            title="Hand-crafted trips, run by us"
            body="Fixed dates, fixed itineraries, vetted local guides. The kind of trip you&rsquo;d book if a friend planned it for you."
            image={engineImages.originals}
            cta={{ href: "/packages", label: "See packages" }}
          />
          <EngineCard
            variant="community"
            eyebrow="Community Trips"
            title="Real travellers, real plans"
            body="Someone&rsquo;s already going where you want to go. Join their trip, split the costs, make a friend."
            image={engineImages.community}
            cta={{ href: "/trips", label: "Find your people" }}
          />
        </div>
      </div>
    </section>
  );
}

function EngineCard({
  variant,
  eyebrow,
  title,
  body,
  image,
  cta,
}: {
  variant: "originals" | "community";
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  cta: { href: string; label: string };
}) {
  const isOriginals = variant === "originals";
  return (
    <Link
      href={cta.href}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 600px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
        <div className="absolute left-4 top-4">
          <Badge variant={variant}>{eyebrow}</Badge>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 max-w-md text-stone-600">{body}</p>
        <span
          className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${
            isOriginals ? "text-yellow-700" : "text-green-800"
          }`}
        >
          {cta.label}
          <ArrowRightIcon />
        </span>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Explore India — destination tiles                                          */
/* -------------------------------------------------------------------------- */

function ExploreDestinations() {
  const destinations = [
    {
      label: "Himachal Pradesh",
      sub: "Mountains & Valleys",
      image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=himachal",
    },
    {
      label: "Kerala",
      sub: "Backwaters & Spice Trails",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=kerala",
    },
    {
      label: "Rajasthan",
      sub: "Forts & Desert Nights",
      image: "https://images.unsplash.com/photo-1477586957327-847a0f3f4fe3?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=rajasthan",
    },
    {
      label: "Meghalaya",
      sub: "Living Root Bridges",
      image: "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=meghalaya",
    },
    {
      label: "Uttarakhand",
      sub: "Treks & Sacred Rivers",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=uttarakhand",
    },
    {
      label: "Goa",
      sub: "Coast & Culture",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
      href: "/trips?q=goa",
    },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Where to?
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Explore India
            </h2>
          </div>
          <Link
            href="/trips"
            className="shrink-0 text-sm font-semibold text-stone-500 hover:text-ink transition-colors"
          >
            All destinations →
          </Link>
        </div>

        {/* Even 3 × 2 grid — no orphans, no uneven rows */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {destinations.map((d) => (
            <Link
              key={d.label}
              href={d.href}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
            >
              <Image
                src={d.image}
                alt={d.label}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradient: only bottom third */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <p className="font-serif text-base font-medium leading-tight text-white sm:text-lg">
                  {d.label}
                </p>
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">{d.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Travel categories                                                           */
/* -------------------------------------------------------------------------- */

function TravelCategories() {
  const cats = [
    { label: "Beach", emoji: "🏖️", href: "/trips?q=beach", bg: "from-sky-400 to-blue-500" },
    { label: "Mountains", emoji: "⛰️", href: "/trips?q=mountains", bg: "from-green-600 to-emerald-600" },
    { label: "Heritage", emoji: "🏛️", href: "/trips?q=heritage", bg: "from-yellow-500 to-orange-600" },
    { label: "Backpacking", emoji: "🎒", href: "/trips?q=backpacking", bg: "from-violet-500 to-purple-600" },
    { label: "Wellness", emoji: "🧘", href: "/trips?q=wellness", bg: "from-rose-400 to-pink-500" },
    { label: "City Breaks", emoji: "🌆", href: "/trips?q=city", bg: "from-stone-500 to-stone-700" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Trip types"
          title="Travel your way"
          subtitle="Find trips that match your style — wherever the mood takes you."
          center
        />
        <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {cats.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className={`group flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br ${c.bg} p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-5`}
            >
              <span className="text-3xl sm:text-4xl">{c.emoji}</span>
              <span className="text-center text-[11px] font-semibold text-white sm:text-xs">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Featured Packages                                                          */
/* -------------------------------------------------------------------------- */

function FeaturedPackages({ packages }: { packages: Package[] }) {
  if (packages.length === 0) return null;
  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Packuptrip Originals"
          accent="amber"
          title="Curated journeys this season"
          link={{ href: "/packages", label: "View all packages" }}
        />
        <div className="mt-10 grid gap-5 grid-cols-2 lg:grid-cols-4">
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Featured Hosts                                                             */
/* -------------------------------------------------------------------------- */

function FeaturedHosts({
  hosts,
  tripCounts,
}: {
  hosts: { id: string; name: string; avatar_url: string | null; id_verified: boolean }[];
  tripCounts: Map<string, number>;
}) {
  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Our top hosts"
          accent="teal"
          title="Led by hosts who've been there"
          link={{ href: "/trips", label: "Browse all trips" }}
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {hosts.slice(0, 4).map((h) => {
            const count = tripCounts.get(h.id) ?? 0;
            return (
              <Link
                key={h.id}
                href={`/hosts/${h.id}`}
                className="group block overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
              >
                {/* Portrait photo */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                  {h.avatar_url ? (
                    <Image
                      src={h.avatar_url}
                      alt={h.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 260px"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-100">
                      <span className="text-5xl font-bold text-stone-300">
                        {h.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                  {/* Verified badge top-right */}
                  {h.id_verified && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-stone-700 shadow backdrop-blur-sm">
                      ✓ Verified
                    </div>
                  )}

                  {/* Name + trips bottom */}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-sm font-bold text-white leading-tight">
                      {h.name}
                    </p>
                    {count > 0 && (
                      <p className="mt-0.5 text-[11px] text-white/80">
                        ♥ {count} {count === 1 ? "trip" : "trips"} hosted
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile CTA */}
                <div className="p-3">
                  <span className="block w-full rounded-xl border border-stone-200 py-2 text-center text-xs font-semibold text-stone-600 transition-colors group-hover:border-stone-400 group-hover:text-ink">
                    View profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Find a trip that fits",
      body: "Filter by destination, dates, and budget. See who else is going.",
    },
    {
      n: "2",
      title: "Book or join in minutes",
      body: "Pay securely through Packuptrip. Your money is held until the trip starts.",
    },
    {
      n: "3",
      title: "Travel together",
      body: "Meet your group, follow the itinerary, and come back with stories.",
    },
  ];
  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="The journey"
          title="How it works"
          subtitle="Whichever side of Packuptrip you start with, the path is simple."
          center
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl bg-stone-50 p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-yellow-600 text-sm font-semibold text-white">
                {s.n}
              </div>
              <div className="mt-4 text-lg font-semibold text-ink">{s.title}</div>
              <p className="mt-1 text-sm text-stone-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Featured Community Trips                                                   */
/* -------------------------------------------------------------------------- */

function FeaturedTrips({
  trips,
  hostMap,
}: {
  trips: Trip[];
  hostMap: Map<string, TripCardHost>;
}) {
  if (trips.length === 0) return null;
  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Community Trips"
          accent="teal"
          title="Open trips looking for travellers"
          link={{ href: "/trips", label: "Browse community trips" }}
        />
        <div className="mt-10 grid gap-5 grid-cols-2 lg:grid-cols-4">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} host={hostMap.get(t.host_id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Trust & Safety                                                             */
/* -------------------------------------------------------------------------- */

function TrustAndSafety() {
  const points = [
    {
      icon: <ShieldIcon />,
      title: "Verified hosts",
      body: "Every Community Trip host completes ID verification before posting.",
    },
    {
      icon: <LockIcon />,
      title: "Secure payments",
      body: "Funds are held by our payment partner until your trip begins.",
    },
    {
      icon: <StarsIcon />,
      title: "Two-way reviews",
      body: "Travellers review hosts. Hosts review travellers. Trust builds both ways.",
    },
    {
      icon: <SupportIcon />,
      title: "Human support",
      body: "Real humans on call before, during, and after every trip.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Trust & safety"
          title="Travel with people you can trust"
          subtitle="Joining a stranger&rsquo;s trip should never feel risky. We built Packuptrip with safety baked in from day one."
          center
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl bg-stone-50 p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-100 text-yellow-700">
                {p.icon}
              </div>
              <div className="mt-4 text-base font-semibold text-ink">
                {p.title}
              </div>
              <p className="mt-1.5 text-sm text-stone-600">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Travellers"
          title="Stories from the road"
          center
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-7"
            >
              <QuoteIcon />
              <blockquote className="text-base leading-relaxed text-ink">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white shadow">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-stone-500">{t.trip}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Host CTA banner                                                            */
/* -------------------------------------------------------------------------- */

function HostCTA() {
  return (
    <section className="bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Badge
            variant="neutral"
            className="bg-white/10 text-white/90 ring-white/20"
          >
            Hosting on Packuptrip
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Planning a trip? Bring people along.
          </h2>
          <p className="mt-3 max-w-xl text-white/70">
            Post your trip in minutes. Pick who joins. Split costs fairly. We
            handle the payments — you handle the memories.
          </p>
        </div>
        <Link
          href="/host"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-7 text-sm font-semibold text-ink shadow-lg transition hover:bg-stone-100"
        >
          Host a trip →
        </Link>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  link,
  accent,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  accent?: "amber" | "teal";
  center?: boolean;
}) {
  const eyebrowColor =
    accent === "teal"
      ? "text-green-800"
      : accent === "amber"
        ? "text-yellow-700"
        : "text-stone-500";
  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row ${center ? "sm:flex-col sm:items-center sm:text-center" : "sm:items-end sm:justify-between"}`}
    >
      <div>
        <div
          className={`text-xs font-semibold uppercase tracking-wider ${eyebrowColor}`}
        >
          {eyebrow}
        </div>
        <h2 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-stone-600 ${center ? "mx-auto" : ""}`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="shrink-0 text-sm font-semibold text-stone-700 hover:text-ink"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}

/* Icons (inline so we don't pull a dependency) */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function StarsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 14 8 20 8 15 12 17 18 12 14.5 7 18 9 12 4 8 10 8" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-yellow-500/70"
      aria-hidden
    >
      <path d="M7 11H4v8h6v-8H7L9 4H5l-2 7h4zm10 0h-3v8h6v-8h-3l2-7h-4l-2 7h4z" />
    </svg>
  );
}
