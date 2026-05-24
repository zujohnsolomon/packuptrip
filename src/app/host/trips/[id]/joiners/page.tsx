import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { CancelJoinerButton } from "./CancelJoinerButton";
import type { Booking, BookingStatus, Profile, Trip, TripStatus } from "@/types/db";

export const metadata = {
  title: "Joiners · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type JoinerRow = Booking & {
  profile: Pick<Profile, "id" | "name" | "email" | "avatar_url"> | null;
};

export default async function JoinersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/host/trips/${id}/joiners`);

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle<Trip>();
  if (!trip) notFound();
  if (trip.host_id !== user.id) notFound();

  // bookings_host_read policy lets the host read all bookings on their trips
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("item_type", "trip")
    .eq("item_id", id)
    .order("created_at", { ascending: false });

  const rows = (bookings ?? []) as Booking[];

  // Hydrate joiner profiles in one query
  const userIds = Array.from(new Set(rows.map((b) => b.user_id)));
  const profileMap = new Map<
    string,
    Pick<Profile, "id" | "name" | "email" | "avatar_url">
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, email, avatar_url")
      .in("id", userIds);
    for (const p of (profiles ?? []) as Pick<
      Profile,
      "id" | "name" | "email" | "avatar_url"
    >[]) {
      profileMap.set(p.id, p);
    }
  }

  const joiners: JoinerRow[] = rows.map((b) => ({
    ...b,
    profile: profileMap.get(b.user_id) ?? null,
  }));

  const total = joiners.length;
  const requested = joiners.filter((b) => b.status === "requested").length;
  const confirmed = joiners.filter((b) => b.status === "confirmed").length;
  const active = requested + confirmed;

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        {/* Page header */}
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-4 px-6 py-6 lg:px-8">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                Hosting · {trip.title}
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Joiners
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                {total === 0
                  ? "No one has joined yet."
                  : `${active} active · ${total} total`}
              </p>
            </div>
            <Link
              href={`/host/trips/${id}`}
              className="text-sm font-medium text-stone-600 hover:text-ink"
            >
              ← Back to trip
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {sp.cancelled && (
            <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-100">
              Booking cancelled. The spot has been freed up.
            </div>
          )}

          {total > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total joiners" value={String(total)} />
              <StatCard label="Requested" value={String(requested)} />
              <StatCard label="Confirmed" value={String(confirmed)} />
              <StatCard
                label="Spots left"
                value={`${trip.spots_left} / ${trip.spots_total}`}
              />
            </div>
          )}

          {total === 0 ? (
            <EmptyState status={trip.status} />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <ul className="divide-y divide-stone-100">
                {joiners.map((joiner) => (
                  <JoinerCard key={joiner.id} joiner={joiner} tripId={id} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

function JoinerCard({
  joiner,
  tripId,
}: {
  joiner: JoinerRow;
  tripId: string;
}) {
  const canCancel =
    joiner.status === "requested" || joiner.status === "confirmed";
  const initials = (joiner.profile?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
      {/* Avatar + identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium text-ink">
            {joiner.profile?.name ?? "Unknown"}
          </div>
          <div className="truncate text-xs text-stone-500">
            {joiner.profile?.email ?? "—"}
          </div>
        </div>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
        <StatusChip status={joiner.status} />
        <span className="text-sm font-semibold text-ink">
          {formatINR(Number(joiner.total))}
        </span>
        <span className="text-xs text-stone-400">
          {formatDistanceToNow(new Date(joiner.created_at), {
            addSuffix: true,
          })}
        </span>
        {canCancel && (
          <CancelJoinerButton bookingId={joiner.id} tripId={tripId} />
        )}
      </div>
    </li>
  );
}

function StatusChip({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    requested: "bg-amber-100 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
    refunded: "bg-red-100 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ status }: { status: TripStatus }) {
  const msg =
    status === "live"
      ? "No one has joined yet. Share your trip link to get the first joiner."
      : status === "pending"
        ? "Joiners will appear here once your trip is approved and goes live."
        : status === "draft"
          ? "Submit your trip for review to start accepting joiners."
          : "This trip is no longer accepting new joiners.";

  return (
    <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm text-stone-600">{msg}</p>
    </div>
  );
}
