import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getTripMemory } from "@/lib/supabase/queries";
import type { TripMemoryData } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTripMemory(id);
  if (!data) return { title: "Trip memory · Packuptrip" };
  return {
    title: `${data.trip.title} — Trip Memory · Packuptrip`,
    description: `We went to ${data.trip.location} together. ${data.crew.length} travellers, ${data.trip.days} days.`,
    openGraph: data.trip.images[0]
      ? { images: [{ url: data.trip.images[0], width: 1200, height: 630 }] }
      : undefined,
  };
}

export default async function TripMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getTripMemory(id);
  if (!data) notFound();

  const { trip, host, crew, reviews, canView } = data;

  // Trip must have started (or be completed) to show memory
  const startDate = new Date(trip.start_date);
  const endDate = new Date(startDate.getTime() + trip.days * 86_400_000);
  const now = new Date();
  const tripHasStarted = now >= startDate;

  if (!tripHasStarted) {
    redirect(`/trips/${id}`);
  }

  // Not a participant → show locked state
  if (!canView) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-white pt-20">
          <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <div className="text-5xl">🔒</div>
            <h1 className="mt-4 text-2xl font-semibold text-ink">This memory is private</h1>
            <p className="mt-2 text-stone-500">
              Only the host and confirmed joiners of this trip can view its memory page.
            </p>
            <Link
              href={`/trips/${id}`}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              View trip →
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const coverImage = trip.images[0] ?? null;
  const hasEnded = now >= endDate;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const formattedStart = startDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const formattedEnd = endDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative h-[56vw] max-h-[520px] min-h-[280px] w-full overflow-hidden bg-stone-900">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={trip.title}
              fill
              sizes="100vw"
              className="object-cover opacity-70"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-stone-900" />
          )}

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 pb-10 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
              Trip Memory
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
              {trip.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80">
              📍 {trip.location} &nbsp;·&nbsp; {formattedStart}
              {trip.days > 1 ? ` — ${formattedEnd}` : ""} &nbsp;·&nbsp; {trip.days}d
            </p>
            {avgRating !== null && (
              <p className="mt-1.5 text-sm font-semibold text-amber-300">
                ★ {avgRating.toFixed(1)} &nbsp;·&nbsp; {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">

          {/* Status banner */}
          {!hasEnded && (
            <div className="mb-8 rounded-2xl bg-teal-50 px-5 py-4 text-sm text-teal-800 ring-1 ring-inset ring-teal-100">
              🚀 This trip is currently in progress — the memory page will fill up as reviews come in after it ends on <strong>{formattedEnd}</strong>.
            </div>
          )}

          {/* Share strip */}
          <ShareStrip tripId={id} tripTitle={trip.title} />

          {/* ── Trip crew ────────────────────────────────────────── */}
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-ink">
              The crew &nbsp;<span className="text-stone-400 font-normal text-base">({crew.length})</span>
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {crew.map((member) => (
                <CrewCard key={member.id} member={member} />
              ))}
            </div>
          </section>

          {/* ── Itinerary ────────────────────────────────────────── */}
          {trip.itinerary && trip.itinerary.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">What we did</h2>
              <ol className="mt-4 space-y-3">
                {trip.itinerary.map((day) => (
                  <li key={day.day} className="flex gap-4 rounded-2xl border border-stone-100 bg-white p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
                      {day.day}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{day.title}</p>
                      {day.description && (
                        <p className="mt-1 text-sm text-stone-500">{day.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* ── Reviews ──────────────────────────────────────────── */}
          {reviews.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">
                What travellers said
                {avgRating !== null && (
                  <span className="ml-2 text-base font-normal text-amber-600">
                    ★ {avgRating.toFixed(1)}
                  </span>
                )}
              </h2>
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <MemoryReviewCard key={r.id} review={r} />
                ))}
              </div>
            </section>
          )}

          {/* ── No reviews yet ───────────────────────────────────── */}
          {reviews.length === 0 && hasEnded && (
            <div className="mt-10 rounded-2xl border border-dashed border-stone-200 px-6 py-10 text-center">
              <p className="text-sm text-stone-400">No reviews yet — be the first to share how the trip went.</p>
              <Link
                href={`/trips/${id}`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Leave a review →
              </Link>
            </div>
          )}

          {/* ── Back link ────────────────────────────────────────── */}
          <div className="mt-12 border-t border-stone-100 pt-6 text-center">
            <Link href={`/trips/${id}`} className="text-sm text-stone-500 hover:text-ink">
              ← Back to trip
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CrewCard({ member }: { member: TripMemoryData["crew"][number] }) {
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const href = member.isHost ? `/hosts/${member.id}` : `/passport/${member.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-stone-100 bg-white px-4 py-3 text-center transition hover:border-teal-200 hover:shadow-sm"
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-teal-50">
        {member.avatar_url ? (
          <Image src={member.avatar_url} alt={member.name} fill sizes="48px" className="object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-sm font-bold text-teal-700">
            {initials}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-ink group-hover:text-teal-700 transition-colors">
          {member.name.split(" ")[0]}
        </p>
        {member.isHost && (
          <p className="text-[10px] font-semibold text-teal-600">Host</p>
        )}
      </div>
    </Link>
  );
}

function MemoryReviewCard({
  review,
}: {
  review: TripMemoryData["reviews"][number];
}) {
  const initials = review.author
    ? review.author.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-stone-100">
          {review.author?.avatar_url ? (
            <img src={review.author.avatar_url} alt={review.author.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-600">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">
              {review.author ? (
                <Link href={`/passport/${review.author.id}`} className="hover:text-teal-700 hover:underline">
                  {review.author.name}
                </Link>
              ) : "Traveller"}
            </span>
            <span className="shrink-0 text-xs font-semibold text-amber-600">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          </div>
          {review.text && (
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{review.text}</p>
          )}
          {review.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags.map((tag: string) => (
                <span key={tag} className="rounded-full bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-inset ring-stone-200">
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

/** Client component for copy-link behaviour */
function ShareStrip({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  // Server-rendered share strip — copy logic handled inline via script
  const url = `/trips/${tripId}/memory`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Share this memory</p>
        <p className="mt-0.5 text-sm text-stone-600 truncate max-w-xs">{tripTitle}</p>
      </div>
      <ShareButton url={url} />
    </div>
  );
}

// Tiny client island just for the copy button
import { ShareButton } from "./ShareButton";
