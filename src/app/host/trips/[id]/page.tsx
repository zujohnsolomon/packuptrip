import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { Inclusions } from "@/components/detail/Inclusions";
import { Itinerary } from "@/components/detail/Itinerary";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import { formatINR } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { HostTripActions } from "./HostTripActions";
import type { Trip, TripStatus } from "@/types/db";

export const metadata = {
  title: "Your trip · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HostTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; cancelled?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/host/trips/${id}`);
  }

  // Host can read any of their own trips regardless of status (RLS).
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle<Trip>();
  if (!trip) notFound();
  // Belt-and-braces: refuse to show another host's trip even if RLS would let it through.
  if (trip.host_id !== user.id) notFound();

  // Active joiners (requested + confirmed only) shown on the joiners card.
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("item_type", "trip")
    .eq("item_id", trip.id)
    .in("status", ["requested", "confirmed"]);

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-4 px-6 py-6 lg:px-8">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-800">
                Hosting
              </div>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {trip.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span>
                  Created{" "}
                  {formatDistanceToNow(new Date(trip.created_at), {
                    addSuffix: true,
                  })}
                </span>
                <span>·</span>
                <StatusChip status={trip.status} />
              </div>
            </div>
            <Link
              href="/host/trips"
              className="text-sm font-medium text-stone-600 hover:text-ink"
            >
              ← All trips
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <FlashBanner sp={sp} />

          {/* Admin feedback - show prominently when present */}
          {trip.rejection_reason && (
            <FeedbackBlock
              tone="red"
              eyebrow="Rejected - admin feedback"
              body={trip.rejection_reason}
              hint="Edit the trip below to address the feedback, then submit it again for review."
            />
          )}
          {trip.admin_notes && trip.status === "pending" && (
            <FeedbackBlock
              tone="amber"
              eyebrow="Changes requested by admin"
              body={trip.admin_notes}
              hint="Update what's needed and resubmit - the trip stays in the queue."
            />
          )}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Left: trip content */}
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
                <div className="relative aspect-[16/9] w-full bg-stone-100">
                  {trip.images[0] && (
                    <Image
                      src={trip.images[0]}
                      alt={trip.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 600px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute left-3 top-3">
                    <Badge variant="community">Community trip</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                  <Stat label="Departs" value={formatHumanDate(trip.start_date)} />
                  <Stat label="Duration" value={`${trip.days} days`} />
                  <Stat
                    label="Per share"
                    value={formatINR(Number(trip.price_per_share))}
                  />
                  <Stat
                    label="Spots"
                    value={`${trip.spots_left}/${trip.spots_total}`}
                  />
                </div>
              </section>

              {trip.images.length > 1 && (
                <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-base font-semibold text-ink">
                    Your photos ({trip.images.length})
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {trip.images.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100"
                      >
                        <Image
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 240px"
                          className="object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {trip.description && (
                <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-base font-semibold text-ink">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                    {trip.description}
                  </p>
                </section>
              )}

              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-semibold text-ink">
                  What&rsquo;s included
                </h3>
                <div className="mt-4">
                  <Inclusions items={trip.includes} />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-semibold text-ink">Day-by-day</h3>
                <div className="mt-5">
                  <Itinerary days={trip.itinerary} accent="teal" />
                </div>
              </section>

              {trip.tags.length > 0 && (
                <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                  <h3 className="text-base font-semibold text-ink">Tags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {trip.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right: actions */}
            <aside className="lg:sticky lg:top-6 lg:self-start space-y-3">
              <HostTripActions
                tripId={trip.id}
                status={trip.status}
                hasFeedback={Boolean(
                  trip.rejection_reason || trip.admin_notes,
                )}
              />
              <BookingsTease
                tripId={trip.id}
                status={trip.status}
                bookingsCount={bookingsCount ?? 0}
              />
              {trip.status === "live" && (
                <Link
                  href={`/trips/${trip.id}`}
                  target="_blank"
                  className="block rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] text-center text-sm font-semibold text-green-800 hover:text-green-900"
                >
                  View public page →
                </Link>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusChip({ status }: { status: TripStatus }) {
  const styles: Record<TripStatus, string> = {
    draft: "bg-stone-100 text-stone-700 ring-stone-200",
    pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    live: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    completed: "bg-stone-200 text-stone-700 ring-stone-300",
    cancelled: "bg-red-100 text-red-800 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

function FeedbackBlock({
  tone,
  eyebrow,
  body,
  hint,
}: {
  tone: "red" | "amber";
  eyebrow: string;
  body: string;
  hint: string;
}) {
  const cls =
    tone === "red"
      ? "bg-red-50 ring-red-100"
      : "bg-yellow-50 ring-yellow-100";
  const eyebrowCls = tone === "red" ? "text-red-700" : "text-yellow-800";
  return (
    <div className={`mb-5 rounded-2xl p-5 ring-1 ring-inset ${cls}`}>
      <div
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${eyebrowCls}`}
      >
        {eyebrow}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
        {body}
      </p>
      <p className="mt-2 text-xs text-stone-600">{hint}</p>
    </div>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { saved?: string; cancelled?: string };
}) {
  if (sp.saved) {
    return (
      <Banner variant="success">Changes saved. Status unchanged.</Banner>
    );
  }
  if (sp.cancelled) {
    return (
      <Banner variant="warning">
        Trip cancelled. It&rsquo;s no longer visible to travellers.
      </Banner>
    );
  }
  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "success" | "warning";
  children: React.ReactNode;
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : "bg-yellow-50 text-yellow-800 ring-yellow-100";
  return (
    <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${cls}`}>
      {children}
    </div>
  );
}

function BookingsTease({
  tripId,
  status,
  bookingsCount,
}: {
  tripId: string;
  status: TripStatus;
  bookingsCount: number;
}) {
  // Only show this card once the trip can actually take bookings.
  if (status !== "live") return null;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Joiners
      </div>
      <div className="mt-1.5 text-lg font-semibold text-ink">
        {bookingsCount === 0
          ? "No one has joined yet"
          : `${bookingsCount} ${bookingsCount === 1 ? "joiner" : "joiners"} so far`}
      </div>
      <Link
        href={`/host/trips/${tripId}/joiners`}
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-green-700 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-green-800"
      >
        Manage joiners
      </Link>
    </div>
  );
}
