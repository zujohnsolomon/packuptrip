import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripCard } from "@/components/ui/TripCard";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // All trips by this host — split into upcoming vs past
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

  // Reviews — only for live trips to keep things clean
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

  // "Most complimented for" — aggregate review tags, take top 3
  const tagCounts = new Map<string, number>();
  for (const r of reviews) {
    for (const t of r.tags ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topCompliments = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // Photo mosaic — gather images from the host's trips
  const mosaicImages: { src: string; alt: string }[] = [];
  for (const trip of allTrips ?? []) {
    for (const img of trip.images) {
      if (mosaicImages.length >= 6) break;
      mosaicImages.push({ src: img, alt: trip.title });
    }
    if (mosaicImages.length >= 6) break;
  }

  const totalHosted = upcomingTrips.length + pastTrips.length;
  const memberYear = new Date(profile.created_at).getFullYear();
  const isOwnProfile = user?.id === id;
  const firstName = profile.name.split(" ")[0];

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-16">

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[340px,1fr] lg:gap-8">

              {/* Left — identity card with speech-bubble bio */}
              <aside className="space-y-4">
                {/* Speech-bubble bio (or fallback intro) */}
                <div className="relative rounded-2xl bg-stone-50 p-5 ring-1 ring-inset ring-stone-200">
                  {profile.bio ? (
                    <p className="font-serif text-base leading-relaxed text-ink">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="font-serif text-base italic leading-relaxed text-stone-400">
                      A new host on Packuptrip — their first trip is the
                      best way to get to know them.
                    </p>
                  )}
                  {/* Tail pointing down to avatar */}
                  <span
                    aria-hidden
                    className="absolute -bottom-2 left-10 h-4 w-4 rotate-45 bg-stone-50 ring-1 ring-inset ring-stone-200"
                    style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
                  />
                </div>

                {/* Avatar + name + rating row */}
                <div className="flex items-start gap-3 pl-2">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-stone-100 ring-2 ring-white shadow-md">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-2xl font-bold text-stone-400">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h1 className="text-lg font-bold text-ink sm:text-xl">
                        {profile.name}
                      </h1>
                      {profile.host_tier === "superhost" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-500">
                          ⭐ Superhost
                        </span>
                      )}
                    </div>
                    {avgRating !== null ? (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium">
                        <span className="text-yellow-400">★</span>
                        <span className="text-ink">{avgRating.toFixed(1)}</span>
                        <span className="text-stone-400">
                          · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-stone-400">
                        No reviews yet
                      </p>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div>
                  {isOwnProfile ? (
                    <Link
                      href="/account/profile"
                      className="block w-full rounded-full border border-stone-200 bg-white py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                    >
                      Edit your profile
                    </Link>
                  ) : (
                    <Link
                      href={`/messages?hostId=${id}`}
                      className="block w-full rounded-full bg-green-700 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
                    >
                      Ask {firstName} a question
                    </Link>
                  )}
                </div>

                {/* Trust signals */}
                <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
                  <TrustRow
                    icon={<ShieldIcon />}
                    label="Identity"
                    value={profile.id_verified ? "Verified" : "Not verified"}
                    ok={profile.id_verified}
                  />
                  <TrustRow
                    icon={<PhoneIcon />}
                    label="Phone"
                    value="Verified"
                    ok={true}
                  />
                  <TrustRow
                    icon={<CalendarIcon />}
                    label="Member since"
                    value={String(memberYear)}
                    ok={null}
                  />
                  {profile.languages.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-xs font-medium text-stone-500">
                        Spoken languages
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile.languages.map((lang) => (
                          <span
                            key={lang}
                            className="rounded-full bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-200"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Right — photo mosaic hero */}
              <div>
                {mosaicImages.length > 0 ? (
                  <PhotoMosaic images={mosaicImages} />
                ) : (
                  <EmptyPhotoState
                    title={isOwnProfile ? "No trip photos yet" : `${firstName} hasn't posted any trips yet`}
                    body={
                      isOwnProfile
                        ? "Once you post a trip with photos, they'll appear here as your visual portfolio."
                        : "Check back soon — or message them to learn more."
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT + COMPLIMENTED FOR ──────────────────────────────────── */}
        {(profile.bio || topCompliments.length > 0 || profile.travel_style_tags.length > 0) && (
          <section className="border-t border-stone-200 bg-white">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr,1fr] lg:gap-14 lg:px-8 lg:py-16">

              {/* About column */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                  About {firstName}
                </p>
                {profile.bio ? (
                  <p className="mt-3 font-serif text-lg leading-relaxed text-stone-700 sm:text-xl">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="mt-3 font-serif text-base italic text-stone-400">
                    {firstName} hasn&rsquo;t added a bio yet. You can still
                    learn about them through their trips below.
                  </p>
                )}

                {/* Location pin */}
                {profile.home_city && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-stone-500">
                    <PinIcon />
                    <span>Based in <span className="font-medium text-stone-700">{profile.home_city}</span></span>
                  </div>
                )}
              </div>

              {/* Right column — Most complimented + Travel style */}
              <div className="space-y-8">
                {topCompliments.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                      Most complimented for
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {topCompliments.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800 ring-1 ring-inset ring-green-100"
                        >
                          <HeartFillIcon />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.travel_style_tags.length > 0 && (
                  <div>
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
            </div>
          </section>
        )}

        {/* ── REVIEWS ───────────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section className="bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    What travellers say
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="font-serif text-3xl font-medium text-ink sm:text-4xl"
                      style={{ fontVariationSettings: "'opsz' 144" }}>
                      ★ {avgRating?.toFixed(1) ?? "—"}
                    </h2>
                    <span className="text-sm text-stone-500">
                      from {reviews.length} {reviews.length === 1 ? "traveller" : "travellers"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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

        {/* ── UPCOMING TRIPS ────────────────────────────────────────────── */}
        {upcomingTrips.length > 0 && (
          <section className="border-t border-stone-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-800">
                · Upcoming with {firstName} ·
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
                    host={{ name: profile.name, avatar: profile.avatar_url, idVerified: profile.id_verified }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PAST TRIPS ────────────────────────────────────────────────── */}
        {pastTrips.length > 0 && (
          <section className="bg-stone-50">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                · Past trips with {firstName} ·
              </p>
              <h2
                className="mt-2 font-serif text-3xl font-medium leading-tight text-ink sm:text-4xl"
                style={{ fontVariationSettings: "'opsz' 144" }}
              >
                Trips you&rsquo;ve missed
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Get a sense of what {firstName}&rsquo;s journeys look like.
              </p>
              <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {pastTrips.slice(0, 8).map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    host={{ name: profile.name, avatar: profile.avatar_url, idVerified: profile.id_verified }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── EMPTY STATE — no trips at all ──────────────────────────────── */}
        {totalHosted === 0 && (
          <section className="bg-white">
            <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
              <p className="font-serif text-3xl italic text-stone-400">
                {isOwnProfile ? "Your stage is set." : "Quiet here, for now."}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                {isOwnProfile
                  ? "Post your first trip to start hosting. Once you do, this page becomes your portfolio."
                  : `${firstName} hasn't posted any trips yet. Drop them a message — sometimes new hosts have plans they haven't shared.`}
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

function PhotoMosaic({ images }: { images: { src: string; alt: string }[] }) {
  /* JoinMyTrip-style 6-image grid: 1 large hero + smaller tiles around it.
   * Falls back gracefully to fewer images. */
  const [first, ...rest] = images;
  return (
    <div className="grid h-full min-h-[320px] grid-cols-2 grid-rows-2 gap-2 sm:min-h-[420px] sm:grid-cols-4 sm:grid-rows-2">
      {/* Large hero — takes 2x2 on desktop, 1x2 on mobile */}
      {first && (
        <div className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl bg-stone-100 sm:col-span-2 sm:row-span-2">
          <Image
            src={first.src}
            alt={first.alt}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
            priority
          />
        </div>
      )}
      {/* Smaller tiles, only visible on sm+ */}
      {rest.slice(0, 4).map((img, i) => (
        <div
          key={i}
          className="relative hidden overflow-hidden rounded-2xl bg-stone-100 sm:block"
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="240px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function EmptyPhotoState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center sm:min-h-[420px]">
      <CameraIcon />
      <p className="mt-4 text-base font-semibold text-stone-600">{title}</p>
      <p className="mt-1 max-w-xs text-sm leading-relaxed text-stone-400">{body}</p>
    </div>
  );
}

function TrustRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean | null;
}) {
  const valueClass =
    ok === true
      ? "text-green-700"
      : ok === false
        ? "text-stone-400"
        : "text-stone-700";
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-stone-600">
        <span className="text-stone-400">{icon}</span>
        <span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueClass}`}>
        {ok === true && "✓ "}
        {value}
      </span>
    </div>
  );
}

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
    <figure className="rounded-2xl bg-white p-5 ring-1 ring-stone-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt={authorName}
                fill
                sizes="40px"
                className="object-cover"
              />
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
              className="rounded-full bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

/* ─── Inline icons ──────────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartFillIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
