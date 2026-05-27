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
  let featuredHosts: {
    id: string;
    name: string;
    avatar_url: string | null;
    id_verified: boolean;
    bio: string | null;
    home_city: string | null;
  }[] = [];
  if (allHostIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, id_verified, bio, home_city")
      .in("id", allHostIds);
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
        <TravelCategories />
        <FeaturedPackages packages={featuredPackages} />
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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-yellow-500 sm:h-auto sm:w-auto sm:shrink-0 sm:px-7"
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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              How Packuptrip works
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Two ways to travel
            </h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <EngineCard
            variant="originals"
            eyebrow="Packuptrip Originals"
            title="Hand-crafted trips, run by us"
            body="Fixed dates, vetted local guides. The kind of trip you'd book if a friend planned it."
            image={engineImages.originals}
            cta={{ href: "/packages", label: "See packages" }}
          />
          <EngineCard
            variant="community"
            eyebrow="Community Trips"
            title="Real travellers, real plans"
            body="Someone's already going where you want to go. Join in, split costs, make a friend."
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
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1 sm:aspect-[16/9]"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Gradient — heaviest at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Badge — top left */}
      <div className="absolute left-4 top-4">
        <Badge variant={variant}>{eyebrow}</Badge>
      </div>

      {/* Text — overlaid on gradient */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-white/75">{body}</p>
        <span
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${
            isOriginals ? "text-yellow-400" : "text-emerald-300"
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
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
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
  /* Compact horizontal pill row — a filter aid, not a hero. Small circular
   * thumbnail + label, scrolls horizontally on mobile, fits inline on
   * desktop. Lives right after Explore India since both are "browse-by". */
  const cats = [
    { label: "Beach",       href: "/trips?q=beach",       image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80" },
    { label: "Mountains",   href: "/trips?q=mountains",   image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80" },
    { label: "Heritage",    href: "/trips?q=heritage",    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=200&q=80" },
    { label: "Backpacking", href: "/trips?q=backpacking", image: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=200&q=80" },
    { label: "Wellness",    href: "/trips?q=wellness",    image: "https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=200&q=80" },
    { label: "City Breaks", href: "/trips?q=city",        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=200&q=80" },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex items-baseline gap-4">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Or by mood
          </span>
        </div>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
          {cats.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-stone-200 bg-white px-2 py-1.5 pr-4 text-sm font-medium text-stone-700 transition-all hover:border-stone-400 hover:text-ink"
            >
              <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-stone-100">
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </span>
              {c.label}
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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <SectionHeader
          eyebrow="Packuptrip Originals"
          accent="amber"
          title="Curated journeys this season"
          link={{ href: "/packages", label: "View all packages" }}
        />
        {/* Mobile: horizontal snap-scroll carousel (full-bleed). Desktop: 4-col grid. */}
        <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {packages.map((p) => (
            <div
              key={p.id}
              className="w-[72%] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <PackageCard pkg={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Featured Hosts                                                             */
/* -------------------------------------------------------------------------- */

type FeaturedHost = {
  id: string;
  name: string;
  avatar_url: string | null;
  id_verified: boolean;
  bio: string | null;
  home_city: string | null;
};

function FeaturedHosts({
  hosts,
  tripCounts,
}: {
  hosts: FeaturedHost[];
  tripCounts: Map<string, number>;
}) {
  const count = hosts.length;

  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <SectionHeader
          eyebrow={count === 1 ? "Meet your host" : "Our top hosts"}
          accent="teal"
          title={count === 1 ? "The face behind your next trip" : "Led by hosts who've been there"}
          link={{ href: "/hosts", label: "Meet all hosts" }}
        />

        <div className="mt-6">
          {count === 1 ? (
            <>
              {/* Mobile: single compact portrait tile, ~half viewport wide */}
              <div className="max-w-[55%] sm:hidden">
                <HostPortraitTile host={hosts[0]} tripCount={tripCounts.get(hosts[0].id) ?? 0} />
              </div>
              {/* Desktop: editorial feature spread */}
              <div className="hidden sm:block">
                <HostFeatureCard host={hosts[0]} tripCount={tripCounts.get(hosts[0].id) ?? 0} />
              </div>
            </>
          ) : (
            <HostGrid hosts={hosts.slice(0, 4)} tripCounts={tripCounts} />
          )}
        </div>
      </div>
    </section>
  );
}

/* Editorial feature card — used when there's a single host. */
function HostFeatureCard({ host, tripCount }: { host: FeaturedHost; tripCount: number }) {
  const location = host.home_city ?? "Packuptrip host";
  return (
    <Link
      href={`/hosts/${host.id}`}
      className="group grid overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
    >
      {/* Photo */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 sm:aspect-auto sm:min-h-[420px]">
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
            <span className="text-7xl font-bold text-stone-300">
              {host.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 p-7 sm:p-10 lg:p-12">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-green-800">
            <span>Featured host</span>
            {host.id_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-800 ring-1 ring-inset ring-green-100">
                ✓ Verified
              </span>
            )}
          </div>
          <h3 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">
            {host.name}
          </h3>
          <p className="mt-1.5 text-sm text-stone-500">{location}</p>
        </div>

        {host.bio ? (
          <p className="text-base leading-relaxed text-stone-700">
            &ldquo;{host.bio}&rdquo;
          </p>
        ) : (
          <p className="text-base italic leading-relaxed text-stone-400">
            A new face on Packuptrip — say hello on their first trip.
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-5">
          <span className="text-sm text-stone-500">
            ♥ {tripCount} {tripCount === 1 ? "trip" : "trips"} hosted
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-green-800">
            View profile
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* Portrait tile grid — used when there are 2+ hosts. */
function HostGrid({
  hosts,
  tripCounts,
}: {
  hosts: FeaturedHost[];
  tripCounts: Map<string, number>;
}) {
  // Column count tracks host count so we don't leave empty columns
  const colCls =
    hosts.length === 2
      ? "grid-cols-2"
      : hosts.length === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid gap-4 ${colCls}`}>
      {hosts.map((h) => (
        <HostPortraitTile
          key={h.id}
          host={h}
          tripCount={tripCounts.get(h.id) ?? 0}
        />
      ))}
    </div>
  );
}

/* Reusable portrait tile — used both inside HostGrid and standalone
 * on mobile for the single-host case. */
function HostPortraitTile({
  host,
  tripCount,
}: {
  host: FeaturedHost;
  tripCount: number;
}) {
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      {host.id_verified && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
          ✓ Verified
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-sm font-semibold leading-tight text-white sm:text-base">
          {host.name}
        </p>
        <p className="mt-0.5 text-[11px] text-white/80">
          {host.home_city ? `${host.home_city} · ` : ""}
          {tripCount} {tripCount === 1 ? "trip" : "trips"}
        </p>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

function HowItWorks() {
  /* Distinctive style: horizontal flow with chevrons. Sequence is the
   * visual language. */
  const steps = [
    { title: "Find a trip", body: "Filter by destination, dates, budget." },
    { title: "Book in minutes", body: "Pay securely. Funds held until trip starts." },
    { title: "Travel together", body: "Meet your group. Come back with stories." },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-start gap-3 sm:flex-1">
              <span
                className="font-serif italic leading-none text-stone-300"
                style={{ fontSize: "2.5rem", fontVariationSettings: "'opsz' 144" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="text-sm font-semibold text-ink sm:text-[15px]">
                  {s.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-500 sm:text-[13px]">
                  {s.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="hidden self-center text-stone-300 sm:block"
                >
                  <ChevronRightIcon />
                </span>
              )}
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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <SectionHeader
          eyebrow="Community Trips"
          accent="teal"
          title="Open trips looking for travellers"
          link={{ href: "/trips", label: "Browse community trips" }}
        />
        {/* Mobile: horizontal snap-scroll carousel (full-bleed). Desktop: 4-col grid. */}
        <div className="mt-6 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {trips.map((t) => (
            <div
              key={t.id}
              className="w-[72%] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <TripCard trip={t} host={hostMap.get(t.host_id)} />
            </div>
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
  /* Distinctive style: horizontal "trust bar" — icons inline as compact
   * badges, with the italic strapline tucked alongside. Reads like a
   * certifications row, not a SaaS feature grid. */
  const points = [
    { icon: <ShieldIcon />, title: "Verified hosts" },
    { icon: <LockIcon />, title: "Secure payments" },
    { icon: <StarsIcon />, title: "Two-way reviews" },
    { icon: <SupportIcon />, title: "Human support" },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="border-y border-stone-200 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <p className="font-serif text-base italic leading-snug text-stone-500 sm:max-w-xs sm:text-[17px]">
              Joining a stranger&rsquo;s trip should never feel like a risk.
            </p>
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-7 sm:gap-y-3">
              {points.map((p) => (
                <span
                  key={p.title}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-700"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-stone-400">
                    {p.icon}
                  </span>
                  {p.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  /* Distinctive style: one giant magazine pull quote — the loudest
   * editorial moment on the page. Other voices sit as small attributions
   * below so we don't lose them. */
  const featured = testimonials[1] ?? testimonials[0];
  const others = testimonials.filter((t) => t.name !== featured.name);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <figure>
          <span
            aria-hidden
            className="block font-serif text-6xl leading-none text-stone-200 sm:text-7xl"
          >
            &ldquo;
          </span>
          <blockquote
            className="-mt-2 font-serif font-medium leading-[1.2] tracking-tight text-ink"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {featured.quote}
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-stone-100">
              <Image
                src={featured.avatar}
                alt={featured.name}
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink">{featured.name}</div>
              <div className="text-xs text-stone-500">{featured.trip}</div>
            </div>
          </figcaption>
        </figure>

        {others.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone-100 pt-6 text-xs text-stone-500">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Also from
            </span>
            {others.map((o) => (
              <span key={o.name} className="inline-flex items-center gap-2">
                <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-stone-100">
                  <Image src={o.avatar} alt={o.name} fill sizes="20px" className="object-cover" />
                </div>
                <span className="text-stone-700">{o.name}</span>
                <span className="text-stone-300">·</span>
                <span className="italic">{o.trip}</span>
              </span>
            ))}
          </div>
        )}
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
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8">
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
        ? "text-yellow-500"
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

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 6 15 12 9 18" />
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
