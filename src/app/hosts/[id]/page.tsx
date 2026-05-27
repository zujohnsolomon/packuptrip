import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripCard } from "@/components/ui/TripCard";
import { WorldMap } from "@/components/shared/WorldMap";
import { COUNTRY_NAME_BY_CODE } from "@/lib/countries";
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
      (data.home_city
        ? `${data.name} hosts trips from ${data.home_city} on Packuptrip.`
        : `${data.name} hosts community trips on Packuptrip.`),
  };
}

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

  const { data: allTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", id)
    .in("status", ["live", "completed"])
    .order("start_date", { ascending: false })
    .returns<Trip[]>();

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrips = (allTrips ?? []).filter((t) => t.start_date >= today);
  const pastTrips = (allTrips ?? []).filter((t) => t.start_date < today);

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

  // Aggregate review tags → "most complimented for"
  const tagCounts = new Map<string, number>();
  for (const r of reviews) {
    for (const t of r.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const topCompliments = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  // All trip images for the gallery — flatten + dedupe
  const galleryImages: { src: string; alt: string }[] = [];
  const seen = new Set<string>();
  for (const trip of allTrips ?? []) {
    for (const img of trip.images) {
      if (!seen.has(img) && galleryImages.length < 9) {
        galleryImages.push({ src: img, alt: trip.title });
        seen.add(img);
      }
    }
  }

  // Cover photo — first trip photo, falls back to avatar if no trips,
  // and ultimately to a brand gradient if neither
  const coverPhoto = galleryImages[0]?.src ?? profile.avatar_url ?? null;

  const totalHosted = upcomingTrips.length + pastTrips.length;
  const memberYear = new Date(profile.created_at).getFullYear();
  const isOwnProfile = user?.id === id;
  const firstName = profile.name.split(" ")[0];

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-16">

        {/* ── COVER HERO ──────────────────────────────────────────────────── */}
        <section className="relative isolate">
          <div className="relative h-[42vh] min-h-[300px] w-full overflow-hidden bg-stone-900 sm:h-[52vh]">
            {coverPhoto ? (
              <Image
                src={coverPhoto}
                alt={`${profile.name}'s travels`}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-80"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-ink" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/80" />

            {/* Bottom content */}
            <div className="absolute inset-x-0 bottom-0">
              <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                  · A Packuptrip host ·
                </p>
                <h1
                  className="mt-3 font-serif font-medium leading-[1.05] tracking-tight text-white"
                  style={{
                    fontSize: "clamp(2.25rem, 6vw, 4.25rem)",
                    fontVariationSettings: "'opsz' 144",
                  }}
                >
                  {profile.name}
                </h1>
                {profile.home_city && (
                  <p className="mt-2 font-serif text-base italic text-white/85 sm:text-lg">
                    Based in {profile.home_city}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── IDENTITY CARD (overlaps hero) ───────────────────────────────── */}
        <section className="relative -mt-12 sm:-mt-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                {/* Avatar */}
                <div className="relative h-24 w-24 shrink-0 self-start overflow-hidden rounded-full bg-stone-100 ring-4 ring-white shadow-md sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-3xl font-bold text-stone-400">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info + CTA */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {profile.host_tier === "superhost" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-500">
                        ⭐ Superhost
                      </span>
                    )}
                    {profile.id_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-800 ring-1 ring-inset ring-green-100">
                        ✓ Identity verified
                      </span>
                    )}
                  </div>

                  {/* Stat row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
                    {avgRating !== null && (
                      <span className="inline-flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold text-ink">
                          {avgRating.toFixed(1)}
                        </span>
                        <span className="text-stone-400">
                          ({reviews.length})
                        </span>
                      </span>
                    )}
                    {totalHosted > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <CompassIcon />
                        <span className="font-semibold text-ink">{totalHosted}</span>{" "}
                        {totalHosted === 1 ? "trip hosted" : "trips hosted"}
                      </span>
                    )}
                    {profile.countries_visited.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <GlobeIcon />
                        <span className="font-semibold text-ink">
                          {profile.countries_visited.length}
                        </span>{" "}
                        {profile.countries_visited.length === 1
                          ? "country"
                          : "countries"}{" "}
                        explored
                      </span>
                    )}
                    {profile.languages.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <ChatBubbleIcon />
                        Speaks{" "}
                        <span className="font-semibold text-ink">
                          {profile.languages.slice(0, 3).join(", ")}
                          {profile.languages.length > 3 ? "…" : ""}
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon />
                      Joined {memberYear}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="sm:shrink-0">
                  {isOwnProfile ? (
                    <Link
                      href="/account/profile"
                      className="block w-full rounded-full border border-stone-200 bg-white px-7 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 sm:w-auto"
                    >
                      Edit profile
                    </Link>
                  ) : (
                    <Link
                      href={`/messages?hostId=${id}`}
                      className="block w-full rounded-full bg-green-700 px-7 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 sm:w-auto"
                    >
                      Ask {firstName} a question
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT + WHAT TRAVELLERS LOVE ────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.5fr,1fr] lg:gap-14 lg:px-8 lg:py-20">

            {/* About */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                · About {firstName} ·
              </p>
              {profile.bio ? (
                <p className="mt-4 font-serif text-lg leading-relaxed text-stone-700 sm:text-xl sm:leading-[1.65]">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-4 font-serif text-base italic leading-relaxed text-stone-400">
                  {isOwnProfile
                    ? "Tell travellers what kind of trips you love to lead. A short bio in your settings turns this section into your story."
                    : `${firstName} hasn't added a bio yet — but their trips below speak for themselves.`}
                </p>
              )}

              {profile.travel_style_tags.length > 0 && (
                <div className="mt-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    Travel style
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.travel_style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* What travellers love (most complimented + a teaser quote) */}
            <aside className="space-y-6">
              {topCompliments.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    · What travellers love ·
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topCompliments.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 ring-1 ring-inset ring-green-100"
                      >
                        <HeartFillIcon /> {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reviews[0] && (
                <figure className="rounded-2xl bg-stone-50 p-6 ring-1 ring-inset ring-stone-100">
                  <span
                    aria-hidden
                    className="block font-serif text-5xl leading-none text-stone-300"
                  >
                    &ldquo;
                  </span>
                  <blockquote className="mt-1 font-serif text-base italic leading-relaxed text-stone-700">
                    {(reviews[0].text ?? "").slice(0, 220)}
                    {(reviews[0].text ?? "").length > 220 ? "…" : ""}
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-stone-500">
                    — {reviews[0].author.name}
                  </figcaption>
                </figure>
              )}
            </aside>
          </div>
        </section>

        {/* ── PHOTO GALLERY ───────────────────────────────────────────────── */}
        {galleryImages.length > 0 && (
          <section className="border-t border-stone-100 bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                · From the field ·
              </p>
              <h2
                className="mt-2 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                Moments from {firstName}&rsquo;s trips
              </h2>
              <div
                className={`mt-8 grid gap-2 sm:gap-3 ${
                  galleryImages.length === 1
                    ? "grid-cols-1"
                    : galleryImages.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {galleryImages.map((img, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-2xl bg-stone-100 ${
                      galleryImages.length === 1
                        ? "aspect-[16/9]"
                        : galleryImages.length === 2
                          ? "aspect-[4/5]"
                          : i === 0 && galleryImages.length >= 5
                            ? "aspect-square sm:col-span-2 sm:row-span-2 sm:aspect-auto"
                            : "aspect-square"
                    }`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── REVIEWS ─────────────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section className="border-t border-stone-100 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                · What travellers say ·
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                <h2
                  className="font-serif text-4xl font-medium text-ink sm:text-5xl"
                  style={{ fontVariationSettings: "'opsz' 144" }}
                >
                  ★ {avgRating?.toFixed(1) ?? "—"}
                </h2>
                <span className="text-sm text-stone-500">
                  · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {reviews.slice(0, 4).map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    authorName={r.author.name}
                    authorAvatar={r.author.avatar_url}
                  />
                ))}
              </div>

              {reviews.length > 4 && (
                <p className="mt-6 text-center text-sm text-stone-500">
                  Showing 4 of {reviews.length} reviews
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── COUNTRIES MAP ───────────────────────────────────────────────── */}
        {profile.countries_visited.length > 0 && (
          <section className="border-t border-stone-100 bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                · The world according to {firstName} ·
              </p>
              <h2
                className="mt-2 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                Countries explored
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                <span className="font-semibold text-ink">
                  {profile.countries_visited.length}
                </span>{" "}
                {profile.countries_visited.length === 1 ? "country" : "countries"}{" "}
                visited so far.
              </p>

              <div className="mt-8 rounded-2xl bg-white p-4 ring-1 ring-stone-100 sm:p-6">
                <WorldMap visited={profile.countries_visited} />
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {profile.countries_visited
                  .map((code) => COUNTRY_NAME_BY_CODE.get(code) ?? code)
                  .sort()
                  .map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-100"
                    >
                      {name}
                    </span>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* ── UPCOMING TRIPS ──────────────────────────────────────────────── */}
        {upcomingTrips.length > 0 && (
          <section className="border-t border-stone-100 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-800">
                · Open right now ·
              </p>
              <h2
                className="mt-2 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                Trips you can still join
              </h2>
              <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    host={{
                      name: profile.name,
                      avatar: profile.avatar_url,
                      idVerified: profile.id_verified,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PAST TRIPS ──────────────────────────────────────────────────── */}
        {pastTrips.length > 0 && (
          <section className="border-t border-stone-100 bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                · From the archive ·
              </p>
              <h2
                className="mt-2 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                Trips you&rsquo;ve missed
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                A taste of {firstName}&rsquo;s past journeys.
              </p>
              <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {pastTrips.slice(0, 8).map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    host={{
                      name: profile.name,
                      avatar: profile.avatar_url,
                      idVerified: profile.id_verified,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── EMPTY STATE — no trips ──────────────────────────────────────── */}
        {totalHosted === 0 && (
          <section className="border-t border-stone-100 bg-white">
            <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
              <p className="font-serif text-3xl italic text-stone-400">
                {isOwnProfile ? "Your stage is set." : "Quiet here, for now."}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                {isOwnProfile
                  ? "Post your first trip to start hosting. Once you do, your trips, photos, and reviews will fill this page."
                  : `${firstName} hasn't posted any trips yet. Send a message — sometimes new hosts have plans they haven't shared.`}
              </p>
              {isOwnProfile && (
                <Link
                  href="/host/new"
                  className="mt-7 inline-flex h-10 items-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                >
                  Post your first trip →
                </Link>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function ReviewCard({
  review,
  authorName,
  authorAvatar,
}: {
  review: Review;
  authorName: string;
  authorAvatar: string | null;
}) {
  const initials = authorName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return (
    <figure className="rounded-2xl bg-stone-50 p-5 ring-1 ring-inset ring-stone-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} fill sizes="40px" className="object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-xs font-semibold text-stone-500">
                {initials}
              </span>
            )}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">{authorName}</div>
            <div className="text-xs text-stone-500">{date}</div>
          </div>
        </div>
        <span className="text-xs font-semibold text-yellow-400">★ {review.rating}/5</span>
      </div>
      {review.text && (
        <blockquote className="mt-4 text-sm leading-relaxed text-stone-700">
          {review.text}
        </blockquote>
      )}
      {review.tags && review.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function CompassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-400">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-400">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-400">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-stone-400">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function HeartFillIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
