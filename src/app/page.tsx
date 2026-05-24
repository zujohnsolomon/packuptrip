import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PackageCard } from "@/components/ui/PackageCard";
import { TripCard } from "@/components/ui/TripCard";
import { Badge } from "@/components/ui/Badge";
import { DatePickerField } from "@/components/ui/DatePickerField";
import {
  featuredPackages,
  featuredTrips,
  featuredTripHosts,
  engineImages,
  heroImage,
  testimonials,
} from "@/lib/seed-data";

export default function Home() {
  return (
    <>
      <Header overlay />
      <main className="flex-1">
        <Hero />
        <TwoEngines />
        <FeaturedPackages />
        <HowItWorks />
        <FeaturedTrips />
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

function Hero() {
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

        {/* Trending strip spans the full hero width so 4 cards have room */}
        <TrendingStrip />
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
        <label className="block flex-1 cursor-text rounded-xl px-4 py-2.5 transition-colors hover:bg-stone-50 sm:py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Where to?
          </div>
          <input
            type="text"
            name="q"
            placeholder="Spiti, Kerala, Ladakh…"
            className="mt-0.5 block w-full bg-transparent text-sm text-ink placeholder-stone-400 focus:outline-none"
          />
        </label>

        <div className="hidden w-px self-stretch bg-stone-200 sm:block" />

        <div className="flex-1">
          <DatePickerField
            name="from"
            label="From"
            placeholder="Any date"
            minDate={new Date()}
            tone="light"
          />
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 sm:h-auto sm:w-auto sm:shrink-0 sm:px-7"
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

/* Trending destinations strip - sits at the bottom of the hero. Real photos
 * of real places we run trips to. Adds visual variety without competing with
 * the headline + search. Each tile links into a pre-filtered browse page. */
function TrendingStrip() {
  const tiles: { label: string; sub: string; image: string; href: string }[] = [
    {
      label: "Spiti Valley",
      sub: "Oct departures",
      image:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70",
      href: "/packages?q=spiti",
    },
    {
      label: "Kerala",
      sub: "Houseboats · backwaters",
      image:
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=70",
      href: "/packages?q=kerala",
    },
    {
      label: "Meghalaya",
      sub: "Living root bridges",
      image:
        "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=600&q=70",
      href: "/packages?q=meghalaya",
    },
    {
      label: "Rajasthan",
      sub: "Forts · desert nights",
      image:
        "https://images.unsplash.com/photo-1477586957327-847a0f3f4fe3?auto=format&fit=crop&w=600&q=70",
      href: "/packages?q=rajasthan",
    },
  ];
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
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/15 transition-transform hover:-translate-y-1"
          >
            <Image
              src={t.image}
              alt={t.label}
              fill
              sizes="(max-width: 640px) 50vw, 220px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="font-serif text-base font-medium leading-tight text-white sm:text-lg">
                {t.label}
              </div>
              <div className="mt-0.5 text-[11px] text-white/80">{t.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
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
            isOriginals ? "text-amber-700" : "text-teal-700"
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
/* Featured Packages                                                          */
/* -------------------------------------------------------------------------- */

function FeaturedPackages() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Packuptrip Originals"
          accent="amber"
          title="Curated journeys this season"
          link={{ href: "/packages", label: "View all packages" }}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredPackages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
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
    <section className="bg-white">
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
              className="rounded-2xl bg-cream p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-600 text-sm font-semibold text-white">
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

function FeaturedTrips() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeader
          eyebrow="Community Trips"
          accent="teal"
          title="Open trips looking for travellers"
          link={{ href: "/trips", label: "Browse community trips" }}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTrips.map((t) => (
            <TripCard key={t.id} trip={t} host={featuredTripHosts[t.id]} />
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
              className="rounded-2xl bg-cream p-6 shadow-[var(--shadow-card)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
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
    <section className="bg-cream">
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
    <section className="bg-teal-700">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Badge
            variant="neutral"
            className="bg-white/15 text-white ring-white/25"
          >
            Hosting on Packuptrip
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Planning a trip? Bring people along.
          </h2>
          <p className="mt-3 max-w-xl text-teal-50/90">
            Post your trip in minutes. Pick who joins. Split costs fairly. We
            handle the payments - you handle the memories.
          </p>
        </div>
        <Link
          href="/host"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-7 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-stone-100"
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
      ? "text-teal-700"
      : accent === "amber"
        ? "text-amber-700"
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
      className="text-amber-500/70"
      aria-hidden
    >
      <path d="M7 11H4v8h6v-8H7L9 4H5l-2 7h4zm10 0h-3v8h6v-8h-3l2-7h-4l-2 7h4z" />
    </svg>
  );
}
