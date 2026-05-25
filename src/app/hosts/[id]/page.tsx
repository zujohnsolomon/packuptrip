import { notFound } from "next/navigation";
import Link from "next/link";
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

// ─── Star display ─────────────────────────────────────────────────────────────

function Stars({ rating, count }: { rating: number; count: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={i < full ? "#f59e0b" : half && i === full ? "url(#half)" : "#e5e7eb"}
              stroke={i < full || (half && i === full) ? "#f59e0b" : "#d1d5db"}
              strokeWidth="1"
            />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-ink">{rating.toFixed(1)}</span>
      <span className="text-xs text-stone-400">({count})</span>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function HostReviewCard({
  review,
  authorName,
  authorAvatar,
}: {
  review: Review;
  authorName: string;
  authorAvatar: string | null;
}) {
  const initials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-amber-100">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-amber-700">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{authorName}</span>
            <div className="flex shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={i < review.rating ? "#f59e0b" : "#e5e7eb"}
                    stroke={i < review.rating ? "#f59e0b" : "#d1d5db"}
                    strokeWidth="1"
                  />
                </svg>
              ))}
            </div>
          </div>
          {review.text && (
            <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
              {review.text}
            </p>
          )}
          {review.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
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

  // Load profile + current user in parallel
  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single<Profile>(),
    supabase.auth.getUser(),
  ]);

  if (!profile) notFound();

  // Load host's live trips + joiner reviews of those trips in parallel
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", id)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .returns<Trip[]>();

  const tripIds = (trips ?? []).map((t) => t.id);

  // Reviews that joiners left on this host's trips (visible only)
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

  // Aggregate rating across all visible reviews
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const totalTrips = (trips ?? []).length;
  const memberYear = new Date(profile.created_at).getFullYear();
  const isOwnProfile = user?.id === id;

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
        {/* ── Hero ── */}
        <div className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-full bg-amber-100 shadow-lg ring-4 ring-white">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-amber-700">
                      {profile.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
                {profile.id_verified && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge size="md" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
                    {profile.name}
                  </h1>
                  {profile.id_verified && (
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-inset ring-teal-200">
                      ID Verified
                    </span>
                  )}
                </div>

                {profile.home_city && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-stone-500 sm:justify-start">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5s4.5-4.75 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="currentColor"/>
                    </svg>
                    {profile.home_city}
                  </p>
                )}

                {/* Stats */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600 sm:justify-start">
                  <span>
                    <strong className="text-ink">{totalTrips}</strong>{" "}
                    {totalTrips === 1 ? "trip hosted" : "trips hosted"}
                  </span>
                  {avgRating !== null && (
                    <Stars rating={avgRating} count={reviews.length} />
                  )}
                  <span>Member since {memberYear}</span>
                </div>

                {/* Travel style tags */}
                {profile.travel_style_tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                    {profile.travel_style_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex shrink-0 flex-col gap-2">
                {isOwnProfile ? (
                  <Link
                    href="/account/profile"
                    className="rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
                  >
                    Edit profile
                  </Link>
                ) : (
                  <Link
                    href={`/messages?hostId=${id}`}
                    className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                  >
                    Message {profile.name.split(" ")[0]}
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-7 max-w-2xl">
                <p className="text-base leading-relaxed text-stone-700">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
          {/* ── Trips ── */}
          {(trips ?? []).length > 0 && (
            <section>
              <h2 className="mb-5 text-lg font-semibold text-ink">
                Trips by {profile.name.split(" ")[0]}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(trips ?? []).map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    host={{ name: profile.name, avatar: profile.avatar_url, idVerified: profile.id_verified }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Reviews ── */}
          {reviews.length > 0 && (
            <section>
              <div className="mb-5 flex items-baseline gap-3">
                <h2 className="text-lg font-semibold text-ink">
                  What joiners say
                </h2>
                {avgRating !== null && (
                  <Stars rating={avgRating} count={reviews.length} />
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((r) => (
                  <HostReviewCard
                    key={r.id}
                    review={r}
                    authorName={r.author.name}
                    authorAvatar={r.author.avatar_url}
                  />
                ))}
              </div>
            </section>
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
      </main>
      <Footer />
    </>
  );
}
