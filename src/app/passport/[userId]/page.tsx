import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { getTravellerPassport } from "@/lib/supabase/queries";
import type { Profile } from "@/types/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const data = await getTravellerPassport(userId);
  if (!data) return { title: "Traveller · Packuptrip" };
  return {
    title: `${data.profile.name} · Packuptrip`,
    description: data.profile.bio
      ? data.profile.bio.slice(0, 140)
      : `${data.profile.name} is a traveller on Packuptrip.`,
  };
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const data = await getTravellerPassport(userId);
  if (!data) notFound();

  const { profile, tripsJoined, reviewsReceived } = data;
  const memberYear = new Date(profile.created_at).getFullYear();
  const avgRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce((s, r) => s + r.rating, 0) / reviewsReceived.length
      : null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-16">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[300px,1fr]">

            {/* ── Left — profile card ────────────────────────────────── */}
            <aside className="space-y-4">

              {/* Bio quote */}
              {profile.bio && (
                <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[var(--shadow-card)]">
                  <p className="text-sm italic leading-relaxed text-stone-600">
                    &ldquo;{profile.bio}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-4">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
                      {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt={profile.name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-base font-bold text-stone-400">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{profile.name}</p>
                      {avgRating !== null && (
                        <p className="text-xs text-yellow-400">★ {avgRating.toFixed(1)} from hosts</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main profile card */}
              <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-[var(--shadow-card)]">
                {/* Avatar */}
                {!profile.bio && (
                  <div className="mb-4 flex flex-col items-center gap-3 text-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-stone-100">
                      {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt={profile.name} fill sizes="96px" className="object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-3xl font-bold text-stone-400">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <h1 className="text-lg font-bold text-ink">{profile.name}</h1>
                        {profile.id_verified && <VerifiedBadge size="md" />}
                        {profile.plus_member && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-900">
                            ✦ Plus
                          </span>
                        )}
                      </div>
                      {profile.home_city && (
                        <p className="mt-0.5 text-xs text-stone-500">📍 {profile.home_city}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2.5">
                  {avgRating !== null && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <span className="text-base">⭐</span>
                      <span>
                        <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span>
                        {" "}avg from {reviewsReceived.length} {reviewsReceived.length === 1 ? "host" : "hosts"}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span className="text-base">🎒</span>
                    <span>
                      <span className="font-semibold text-ink">{tripsJoined.length}</span>
                      {" "}{tripsJoined.length === 1 ? "trip" : "trips"} joined
                    </span>
                  </div>
                  {profile.home_city && profile.bio && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <span className="text-base">📍</span>
                      <span>{profile.home_city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Traveller since <span className="font-medium text-ink">{memberYear}</span></span>
                  </div>
                  {profile.id_verified && (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-600">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                      </svg>
                      <span>Identity <span className="font-medium text-ink">Verified</span></span>
                    </div>
                  )}
                </div>

                {/* Languages */}
                {profile.languages.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages.map((l) => (
                        <span key={l} className="rounded-full bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-inset ring-stone-200">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel style tags */}
                {profile.travel_style_tags.length > 0 && (
                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Travel style</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.travel_style_tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Right — trips + reviews ────────────────────────────── */}
            <div className="space-y-8">

              {/* Header (shown when there's a bio — avatar is in the bio card) */}
              {profile.bio && (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-stone-100">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt={profile.name} fill sizes="56px" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xl font-bold text-stone-400">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h1 className="text-xl font-bold text-ink">{profile.name}</h1>
                      {profile.id_verified && <VerifiedBadge size="md" />}
                    </div>
                    {profile.home_city && (
                      <p className="text-sm text-stone-500">📍 {profile.home_city}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Trips joined */}
              <section>
                <h2 className="text-base font-semibold text-ink">
                  {tripsJoined.length === 0 ? "No trips yet" : `Trips joined (${tripsJoined.length})`}
                </h2>
                {tripsJoined.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-400">
                    {profile.name.split(" ")[0]} hasn&apos;t joined any trips yet.
                  </p>
                ) : (
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {tripsJoined.map((t) => (
                      <li key={t.bookingId}>
                        <Link
                          href={`/${t.itemType === "trip" ? "trips" : "packages"}/${t.itemId}`}
                          className="group flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 transition hover:border-green-200 hover:shadow-sm"
                        >
                          {t.image ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                              <Image src={t.image} alt={t.title} fill sizes="56px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                              🗺️
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink group-hover:text-green-800 transition-colors">
                              {t.title}
                            </p>
                            <p className="truncate text-xs text-stone-400">{t.location}</p>
                            <p className="mt-0.5 text-[11px] text-stone-400">
                              {new Date(t.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Reviews from hosts */}
              {reviewsReceived.length > 0 && (
                <section>
                  <h2 className="text-base font-semibold text-ink">
                    What hosts say ({reviewsReceived.length})
                  </h2>
                  <div className="mt-3 space-y-3">
                    {reviewsReceived.map((r) => (
                      <HostReviewCard key={r.id} review={r} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function HostReviewCard({
  review,
}: {
  review: TravellerPassportData["reviewsReceived"][number];
}) {
  type PassportReview = TravellerPassportData["reviewsReceived"][number];

  const r = review as PassportReview;
  const initials = r.author
    ? r.author.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-stone-100">
          {r.author?.avatar_url ? (
            <img src={r.author.avatar_url} alt={r.author.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-600">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">
              {r.author ? (
                <Link href={`/hosts/${r.author.id}`} className="hover:text-green-800 hover:underline">
                  {r.author.name}
                </Link>
              ) : "Host"}
            </span>
            <span className="shrink-0 text-xs font-semibold text-yellow-400">
              {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
            </span>
          </div>
          {r.text && (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{r.text}</p>
          )}
          {r.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {r.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-stone-400">
            {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Import type for the component — needs to be available after the function
import type { TravellerPassportData } from "@/lib/supabase/queries";
