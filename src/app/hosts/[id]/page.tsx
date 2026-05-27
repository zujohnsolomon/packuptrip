import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Trip, Review } from "@/types/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("name, home_city, bio")
    .eq("id", id)
    .single<Pick<Profile, "name" | "home_city" | "bio">>();

  if (!data) return { title: "Host · Packuptrip" };
  return {
    title: `${data.name} · Host on Packuptrip`,
    description:
      data.bio?.slice(0, 160) ??
      `${data.name} hosts community trips on Packuptrip.`,
  };
}

type JoinerAvatar = { id: string; name: string; avatar_url: string | null };

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  // Trips
  const { data: allTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", id)
    .in("status", ["live", "completed"])
    .order("start_date", { ascending: false })
    .returns<Trip[]>();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = (allTrips ?? []).filter((t) => t.start_date >= today);
  const featuredTrips = upcomingTrips.slice(0, 3);
  const totalHosted = (allTrips ?? []).length;

  // Reviews
  const tripIds = (allTrips ?? []).map((t) => t.id);
  const { data: rawReviews } = tripIds.length
    ? await supabase
        .from("reviews")
        .select("*, author:profiles!author_id(id, name, avatar_url)")
        .in("subject_id", tripIds)
        .eq("subject_type", "trip")
        .eq("reviewer_role", "joiner")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const reviews = (rawReviews ?? []) as (Review & {
    author: { id: string; name: string; avatar_url: string | null };
  })[];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  // "Happy travelers" — confirmed bookings on this host's trips
  const happyTravelersCount = tripIds.length
    ? (await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("trip_id", tripIds)
        .eq("status", "confirmed")).count ?? 0
    : 0;

  // Joiner avatars for the 3 featured trip cards — one query, group by trip
  const featuredTripIds = featuredTrips.map((t) => t.id);
  const joinersByTrip = new Map<string, JoinerAvatar[]>();
  if (featuredTripIds.length > 0) {
    const { data: bookingsRaw } = await supabase
      .from("bookings")
      .select("trip_id, traveller:profiles!user_id(id, name, avatar_url)")
      .in("trip_id", featuredTripIds)
      .eq("status", "confirmed");
    // Supabase types `traveller` as an array even on a 1:1 join — normalize via unknown
    const bookings = (bookingsRaw ?? []) as unknown as {
      trip_id: string;
      traveller: JoinerAvatar | JoinerAvatar[] | null;
    }[];
    for (const b of bookings) {
      const traveller = Array.isArray(b.traveller) ? b.traveller[0] : b.traveller;
      if (!traveller) continue;
      const list = joinersByTrip.get(b.trip_id) ?? [];
      list.push(traveller);
      joinersByTrip.set(b.trip_id, list);
    }
  }

  // Photo gallery for the "Moments from the road" tile
  const galleryImages: string[] = [];
  const seen = new Set<string>();
  for (const trip of allTrips ?? []) {
    for (const img of trip.images) {
      if (!seen.has(img) && galleryImages.length < 6) {
        galleryImages.push(img);
        seen.add(img);
      }
    }
  }

  // Hero cover image: first trip image, fallback avatar
  const coverPhoto = galleryImages[0] ?? profile.avatar_url ?? null;

  // Inline mountain feature image: the second trip photo if available
  const aboutFeatureImage = galleryImages[1] ?? galleryImages[0] ?? null;

  // Local time at the host's home city (best-effort — falls back to user's time)
  const localTime = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // First review for the sidebar pull-quote
  const sidebarQuote = reviews.find((r) => r.text && r.text.length > 30);

  const memberMonth = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const isOwnProfile = user?.id === id;
  const firstName = profile.name.split(" ")[0];

  // Default tagline if the host hasn't set one
  const tagline = "Meet people. Share stories. Create memories.";

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f6f1ea] pt-16">

        {/* ──────────────── HERO ──────────────── */}
        <section className="relative">
          {/* Wide cream background extends behind the hero */}
          <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
            <div className="relative grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] lg:grid-cols-[1fr,1.1fr]">

              {/* Left — editorial copy */}
              <div className="relative z-10 px-6 pt-8 pb-32 sm:px-10 sm:pt-12 sm:pb-44 lg:px-12 lg:pb-52 lg:pt-16">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-500">
                  TRIP HOST
                </p>
                <h1
                  className="mt-3 font-serif font-medium leading-[1.05] tracking-tight text-ink"
                  style={{
                    fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  Exploring the world.{" "}
                  <span className="italic">Sharing what matters.</span>
                </h1>
                {profile.bio && (
                  <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-600 sm:text-[15px]">
                    {profile.bio}
                  </p>
                )}
                {profile.home_city && (
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-50 px-3 py-1.5 text-xs text-stone-600 ring-1 ring-inset ring-stone-200 sm:gap-4 sm:px-4 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <PinIcon /> {profile.home_city}
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="inline-flex items-center gap-1.5">
                      Local time
                      <span className="font-semibold text-ink">{localTime}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Right — cover image */}
              <div className="relative h-[260px] overflow-hidden sm:h-[340px] lg:h-auto lg:min-h-[440px]">
                {coverPhoto ? (
                  <Image
                    src={coverPhoto}
                    alt={`${profile.name}'s travels`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-400" />
                )}
                {/* Soft fade so text on the left isn't fighting an edge */}
                <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white to-transparent lg:w-1/3" />

                {/* Floating stats card top-right */}
                <div className="absolute right-4 top-4 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.10)] sm:right-6 sm:top-6 sm:p-5">
                  <StatRow label="Trips Hosted" value={totalHosted} />
                  <Divider />
                  <StatRow label="Happy Travelers" value={happyTravelersCount} />
                  <Divider />
                  <div>
                    <div className="text-2xl font-bold text-ink sm:text-3xl">
                      {avgRating !== null ? avgRating.toFixed(1) : "—"}
                    </div>
                    {avgRating !== null && (
                      <>
                        <StarRow rating={avgRating} />
                        <div className="mt-0.5 text-[11px] text-stone-500">
                          ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                        </div>
                      </>
                    )}
                    {avgRating === null && (
                      <div className="mt-0.5 text-[11px] text-stone-400">
                        No reviews yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ──── Centered avatar + name + tagline (overlaps both columns) ──── */}
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex flex-col items-center px-4 sm:bottom-8">
                {/* White circular frame around the avatar */}
                <div className="relative h-32 w-32 sm:h-44 sm:w-44">
                  <div className="absolute inset-0 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.10)]" />
                  <div className="absolute inset-2 overflow-hidden rounded-full bg-stone-100">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-4xl font-bold text-stone-400">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {/* Save (star) badge under avatar — placeholder, decorative for now */}
                <button
                  type="button"
                  aria-label="Save host"
                  className="pointer-events-auto -mt-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink text-yellow-400 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-colors hover:bg-stone-800"
                >
                  <StarFillIcon />
                </button>
                <h2
                  className="mt-3 font-serif font-medium tracking-tight text-ink"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {profile.name}
                </h2>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Travel Host
                </p>
                <p className="mt-2 font-serif text-sm italic text-stone-500 sm:text-base">
                  {tagline}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── TAB NAV + ACTIONS ──────────────── */}
        <section className="bg-[#f6f1ea]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {[
                { label: "About", href: "#about", active: true },
                { label: "Trips", href: "#trips" },
                { label: "Reviews", href: "#reviews" },
                { label: "Stories", href: "/stories" },
                { label: "Gallery", href: "#gallery" },
              ].map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  className={`relative pb-1 font-medium transition-colors ${
                    t.active
                      ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-ink"
                      : "text-stone-500 hover:text-ink"
                  }`}
                >
                  {t.label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {isOwnProfile ? (
                <Link
                  href="/account/profile"
                  className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
                >
                  Edit profile
                </Link>
              ) : (
                <>
                  <Link
                    href={`/messages?hostId=${id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-green-700 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
                  >
                    <PaperPlaneIcon /> Connect
                  </Link>
                  <Link
                    href={`/messages?hostId=${id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <ChatBubbleIcon /> Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ──────────────── MAIN GRID ──────────────── */}
        <section className="bg-[#f6f1ea] pb-16 sm:pb-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.7fr,1fr] lg:gap-8 lg:px-8">

            {/* ── LEFT (main) ── */}
            <div className="space-y-10">

              {/* ABOUT */}
              <article id="about" className="rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  About me
                </p>
                <div className="mt-3 grid gap-6 sm:grid-cols-[1.1fr,1fr] sm:gap-8">
                  <div>
                    <h3
                      className="font-serif font-medium leading-tight text-ink"
                      style={{
                        fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
                        fontVariationSettings: "'opsz' 144",
                      }}
                    >
                      Travelling is my way of understanding life.
                    </h3>
                    {profile.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-stone-600">
                        {profile.bio}
                      </p>
                    )}
                    {profile.travel_style_tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {profile.travel_style_tags.slice(0, 6).map((t) => (
                          <StyleIcon key={t} label={t} />
                        ))}
                      </div>
                    )}
                  </div>
                  {aboutFeatureImage && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
                      <Image
                        src={aboutFeatureImage}
                        alt="From the field"
                        fill
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </article>

              {/* FEATURED TRIPS */}
              {featuredTrips.length > 0 && (
                <article id="trips">
                  <div className="mb-4 flex items-baseline justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                      Featured trips
                    </p>
                    <Link
                      href={`/trips?host=${id}`}
                      className="text-sm font-medium text-stone-600 hover:text-ink"
                    >
                      View all trips →
                    </Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {featuredTrips.map((trip) => (
                      <FeaturedTripCard
                        key={trip.id}
                        trip={trip}
                        joiners={joinersByTrip.get(trip.id) ?? []}
                        bookedCount={joinersByTrip.get(trip.id)?.length ?? 0}
                      />
                    ))}
                  </div>
                </article>
              )}

              {/* TRAVELER REVIEWS */}
              {reviews.length > 0 && (
                <article id="reviews" className="rounded-3xl bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Traveler reviews
                  </p>
                  <div className="mt-4 grid gap-6 sm:grid-cols-[auto,1fr,1fr] sm:gap-8">
                    {/* Score block */}
                    <div className="sm:border-r sm:border-stone-100 sm:pr-8">
                      <div className="text-4xl font-bold text-ink sm:text-5xl">
                        {avgRating?.toFixed(1) ?? "—"}
                      </div>
                      <StarRow rating={avgRating ?? 0} />
                      <div className="mt-1 text-xs text-stone-500">
                        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                      </div>
                    </div>
                    {/* 2 review snippets */}
                    {reviews.slice(0, 2).map((r) => (
                      <ReviewSnippet key={r.id} review={r} />
                    ))}
                  </div>
                  {reviews.length > 2 && (
                    <div className="mt-6 text-right">
                      <Link
                        href={`#reviews-all`}
                        className="text-sm font-medium text-stone-600 hover:text-ink"
                      >
                        View all reviews →
                      </Link>
                    </div>
                  )}
                </article>
              )}

              {/* Empty state if everything is empty */}
              {totalHosted === 0 && reviews.length === 0 && (
                <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
                  <p className="font-serif text-2xl italic text-stone-400">
                    {isOwnProfile ? "Your stage is set." : "Quiet here, for now."}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500">
                    {isOwnProfile
                      ? "Post your first trip to begin filling out this page."
                      : `${firstName} hasn't posted any trips yet — drop them a message.`}
                  </p>
                  {isOwnProfile && (
                    <Link
                      href="/host/new"
                      className="mt-6 inline-flex h-10 items-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800"
                    >
                      Post your first trip →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT (sidebar) ── */}
            <aside className="space-y-6">
              {/* Quote card */}
              {sidebarQuote ? (
                <figure className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm sm:p-7">
                  <span aria-hidden className="block font-serif text-4xl leading-none text-stone-300">
                    &ldquo;
                  </span>
                  <blockquote className="-mt-2 font-serif text-base leading-relaxed text-stone-700">
                    {(sidebarQuote.text ?? "").slice(0, 180)}
                    {(sidebarQuote.text ?? "").length > 180 ? "…" : ""}
                  </blockquote>
                  {/* Faux travel-stamp graphic, decorative */}
                  <StampGraphic />
                </figure>
              ) : (
                <figure className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm sm:p-7">
                  <span aria-hidden className="block font-serif text-4xl leading-none text-stone-300">
                    &ldquo;
                  </span>
                  <blockquote className="-mt-2 font-serif text-base italic leading-relaxed text-stone-500">
                    The best journeys answer questions that in the beginning
                    you didn&rsquo;t even think to ask.
                  </blockquote>
                  <StampGraphic />
                </figure>
              )}

              {/* Profile facts */}
              <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-7">
                <div className="space-y-5">
                  {profile.home_city && (
                    <FactRow icon={<PinIcon />} label="From" value={profile.home_city} />
                  )}
                  {profile.languages.length > 0 && (
                    <FactRow
                      icon={<ChatBubbleIcon />}
                      label="Languages"
                      value={profile.languages.join(", ")}
                    />
                  )}
                  <FactRow
                    icon={<UserIcon />}
                    label="Member since"
                    value={memberMonth}
                  />
                  {profile.id_verified && (
                    <FactRow
                      icon={<ShieldIcon />}
                      label="Identity"
                      value="Verified"
                      accent
                    />
                  )}
                  {profile.host_tier === "superhost" && (
                    <FactRow
                      icon={<StarOutlineIcon />}
                      label="Status"
                      value="Superhost"
                      accent
                    />
                  )}
                </div>
              </div>

              {/* Let's connect — only shows if there are real socials. Skipped for now. */}

              {/* Moments from the road */}
              {galleryImages.length > 0 && (
                <div id="gallery">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    Moments from the road
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {galleryImages.slice(0, 6).map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100"
                      >
                        <Image
                          src={src}
                          alt="Moment"
                          fill
                          sizes="160px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ─── Hero sub-bits ──────────────────────────────────────────────────────── */

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="pr-6">
      <div className="text-2xl font-bold text-ink sm:text-3xl">{value}</div>
      <div className="text-[11px] text-stone-500">{label}</div>
    </div>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-stone-100" />;
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="mt-1 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={i < full || (half && i === full) ? "#f59e0b" : "#e5e7eb"}
          />
        </svg>
      ))}
    </div>
  );
}

/* ─── Style chip with icon ───────────────────────────────────────────────── */

function StyleIcon({ label }: { label: string }) {
  const map: Record<string, React.ReactNode> = {
    Adventure: <AdventureIcon />,
    Culture: <CultureIcon />,
    Food: <FoodIcon />,
    Foodie: <FoodIcon />,
    Photography: <CameraIcon />,
    Nature: <LeafIcon />,
    Beach: <LeafIcon />,
    Mountains: <AdventureIcon />,
  };
  const icon = map[label] ?? <SparkleIcon />;
  return (
    <div className="flex w-16 flex-col items-center gap-1.5 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-stone-100 text-stone-600">
        {icon}
      </span>
      <span className="text-[11px] font-medium text-stone-600">{label}</span>
    </div>
  );
}

/* ─── Featured trip card with joiner avatars ─────────────────────────────── */

function FeaturedTripCard({
  trip,
  joiners,
  bookedCount,
}: {
  trip: Trip;
  joiners: JoinerAvatar[];
  bookedCount: number;
}) {
  const remaining = bookedCount - 4;
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {trip.images[0] && (
          <Image
            src={trip.images[0]}
            alt={trip.title}
            fill
            sizes="(max-width: 640px) 50vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-stone-700 backdrop-blur-sm">
          Upcoming
        </span>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-bold text-ink">{trip.title}</h4>
        <p className="mt-1 text-xs text-stone-500">
          {trip.days} {trip.days === 1 ? "day" : "days"}
          {trip.location && ` · ${trip.location}`}
        </p>
        {bookedCount > 0 && (
          <div className="mt-3 flex items-center -space-x-2">
            {joiners.slice(0, 4).map((j) => (
              <div
                key={j.id}
                className="relative h-7 w-7 overflow-hidden rounded-full bg-stone-100 ring-2 ring-white"
                title={j.name}
              >
                {j.avatar_url ? (
                  <Image
                    src={j.avatar_url}
                    alt={j.name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[10px] font-semibold text-stone-500">
                    {j.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {remaining > 0 && (
              <span className="relative inline-flex h-7 items-center justify-center rounded-full bg-stone-100 px-2 text-[11px] font-semibold text-stone-700 ring-2 ring-white">
                +{remaining}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Review snippet for the review summary block ────────────────────────── */

function ReviewSnippet({
  review,
}: {
  review: Review & { author: { id: string; name: string; avatar_url: string | null } };
}) {
  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  return (
    <div>
      <blockquote className="text-sm italic leading-relaxed text-stone-700">
        &ldquo;{(review.text ?? "").slice(0, 160)}
        {(review.text ?? "").length > 160 ? "…" : ""}&rdquo;
      </blockquote>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-stone-100">
          {review.author.avatar_url ? (
            <Image
              src={review.author.avatar_url}
              alt={review.author.name}
              fill
              sizes="28px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-[10px] font-semibold text-stone-500">
              {review.author.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="text-xs leading-tight">
          <div className="font-semibold text-ink">{review.author.name}</div>
          <div className="text-stone-500">{date}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar fact row ───────────────────────────────────────────────────── */

function FactRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
          {label}
        </div>
        <div className={`mt-0.5 text-sm font-semibold ${accent ? "text-green-800" : "text-ink"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Decorative stamp graphic for the quote card ─────────────────────────── */

function StampGraphic() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className="pointer-events-none absolute bottom-3 right-3 h-20 w-20 text-stone-200 opacity-80"
    >
      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
      <path
        d="M60 30 a 30 30 0 0 1 0 60 a 30 30 0 0 1 0 -60 z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />
      <text
        x="60"
        y="64"
        fontFamily="serif"
        fontSize="6"
        textAnchor="middle"
        fill="currentColor"
        letterSpacing="2"
      >
        PACKUPTRIP
      </text>
    </svg>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function StarOutlineIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarFillIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function AdventureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5-10 4 8 3-5 4 7H3z" />
    </svg>
  );
}

function CultureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21V13h6v8" />
    </svg>
  );
}

function FoodIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 1 1-12 0M6 8h12M6 12h12M9 21h6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96 21 8 21 13 19 17a7 7 0 0 1-8 3z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0 L13.5 8.5 22 12 13.5 15.5 12 24 10.5 15.5 2 12 10.5 8.5z" />
    </svg>
  );
}
