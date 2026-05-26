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
    .select("name, home_city")
    .eq("id", id)
    .single<Pick<Profile, "name" | "home_city">>();

  if (!data) return { title: "Host · Packuptrip" };
  return {
    title: `${data.name} · Packuptrip`,
    description: data.home_city
      ? `${data.name} hosts trips from ${data.home_city} on Packuptrip.`
      : `${data.name} hosts community trips on Packuptrip.`,
  };
}

// ─── Star row ──────────────────────────────────────────────────────────────────

function Stars({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i < full ? "#f59e0b" : half && i === full ? "url(#half)" : "#e5e7eb"}
              stroke={i < full || (half && i === full) ? "#f59e0b" : "#d1d5db"}
              strokeWidth="1"
            />
          </svg>
        ))}
      </div>
      <span className="text-sm font-bold text-ink">{rating.toFixed(2)}/5</span>
      <span className="text-xs text-stone-400">· {count} {count === 1 ? "review" : "reviews"}</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

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
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-stone-100">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-600">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{authorName}</span>
            <span className="shrink-0 text-xs font-semibold text-amber-600">
              ★ {review.rating}/5
            </span>
          </div>
          {review.text && (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{review.text}</p>
          )}
          {review.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", id)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .returns<Trip[]>();

  const tripIds = (trips ?? []).map((t) => t.id);

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

  const totalTrips = (trips ?? []).length;
  const memberYear = new Date(profile.created_at).getFullYear();
  const isOwnProfile = user?.id === id;
  const firstName = profile.name.split(" ")[0];

  // Collect up to 6 trip images for the mosaic
  const mosaicImages: { src: string; alt: string }[] = [];
  for (const trip of trips ?? []) {
    for (const img of trip.images) {
      if (mosaicImages.length >= 6) break;
      mosaicImages.push({ src: img, alt: trip.title });
    }
    if (mosaicImages.length >= 6) break;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-16">

        {/* ── 2-column layout ──────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[320px,1fr]">

            {/* ── Left — sticky profile card ─────────────────────────────── */}
            <aside className="space-y-4">
              {/* Bio quote card */}
              {profile.bio && (
                <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[var(--shadow-card)]">
                  <p className="text-sm italic leading-relaxed text-stone-600">
                    &ldquo;{profile.bio}&rdquo;
                  </p>

                  {/* Avatar row */}
                  <div className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-stone-100">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-lg font-bold text-stone-400">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {profile.id_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <VerifiedBadge size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-ink">
                          {profile.name}
                        </p>
                        {profile.host_tier === "superhost" && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            ⭐ Superhost
                          </span>
                        )}
                      </div>
                      {avgRating !== null && (
                        <p className="text-xs text-amber-600">
                          ★ {avgRating.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profile card */}
              <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[var(--shadow-card)]">
                {/* Big avatar */}
                {!profile.bio && (
                  <div className="mb-4 flex flex-col items-center gap-3 text-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-stone-100">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-3xl font-bold text-stone-400">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {profile.id_verified && (
                        <div className="absolute -bottom-1 -right-1">
                          <VerifiedBadge size="md" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <h1 className="text-lg font-bold text-ink">{profile.name}</h1>
                        {profile.host_tier === "superhost" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            ⭐ Superhost
                          </span>
                        )}
                      </div>
                      {profile.home_city && (
                        <p className="text-xs text-stone-500">📍 {profile.home_city}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2.5">
                  {avgRating !== null && (
                    <Stars rating={avgRating} count={reviews.length} />
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="text-base">🗺️</span>
                    <span><strong className="text-ink">{totalTrips}</strong> {totalTrips === 1 ? "trip" : "trips"} hosted</span>
                  </div>
                  {profile.home_city && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <span className="text-base">📍</span>
                      <span>{profile.home_city}</span>
                    </div>
                  )}
                </div>

                {/* Message / Edit button */}
                <div className="mt-4">
                  {isOwnProfile ? (
                    <Link
                      href="/account/profile"
                      className="block w-full rounded-xl border border-stone-200 py-2.5 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Edit profile
                    </Link>
                  ) : (
                    <Link
                      href={`/messages?hostId=${id}`}
                      className="block w-full rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Message {firstName}
                    </Link>
                  )}
                </div>

                {/* Trust signals */}
                <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                  {profile.host_tier === "superhost" && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <span className="shrink-0 text-base leading-none">⭐</span>
                      <span><span className="font-semibold text-amber-700">Superhost</span> — top-rated trusted host</span>
                    </div>
                  )}
                  {profile.id_verified && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal-500">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                      </svg>
                      <span>Identity <span className="font-medium text-ink">Verified</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Member since <span className="font-medium text-ink">{memberYear}</span></span>
                  </div>
                </div>

                {/* Languages */}
                {profile.languages.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Spoken languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-200"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel style tags */}
                {profile.travel_style_tags.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Travel style
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.travel_style_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Right — content ────────────────────────────────────────── */}
            <div className="space-y-10">

              {/* Photo mosaic from trips */}
              {mosaicImages.length >= 3 && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-ink">
                    Moments from {firstName}&rsquo;s trips
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {mosaicImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative aspect-square overflow-hidden rounded-xl bg-stone-100"
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 640px) 33vw, 200px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              {profile.bio && (
                <div>
                  <h2 className="mb-3 text-lg font-bold text-ink">About {firstName}</h2>
                  <p className="text-base leading-relaxed text-stone-600">{profile.bio}</p>
                </div>
              )}

              {/* Trips */}
              {(trips ?? []).length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-bold text-ink">
                    Upcoming trips with {firstName}
                  </h2>
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                    {(trips ?? []).map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        host={{ name: profile.name, avatar: profile.avatar_url, idVerified: profile.id_verified }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div>
                  <div className="mb-4 flex items-baseline gap-3">
                    <h2 className="text-lg font-bold text-ink">
                      What my travel buddies say
                    </h2>
                    {avgRating !== null && (
                      <Stars rating={avgRating} count={reviews.length} />
                    )}
                  </div>
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <ReviewCard
                        key={r.id}
                        review={r}
                        authorName={r.author.name}
                        authorAvatar={r.author.avatar_url}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(trips ?? []).length === 0 && reviews.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-400">
                  {isOwnProfile
                    ? "Your profile is live. Post your first trip to start hosting."
                    : "This host hasn't posted any trips yet."}
                  {isOwnProfile && (
                    <div className="mt-4">
                      <Link
                        href="/host/new"
                        className="inline-flex items-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Post a trip →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
