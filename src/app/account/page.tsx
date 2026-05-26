import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import {
  getBookedItem,
  listMyBookings,
  type BookedItem,
} from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import type { Booking, Profile } from "@/types/db";

export const metadata = { title: "Your account · Packuptrip" };

export default async function AccountPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account");

  const [{ data: profile }, bookings] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    listMyBookings(),
  ]);

  // Resolve each booking's underlying item (package or trip) so we can show
  // a title + photo on the card. Done in parallel.
  const enriched = await Promise.all(
    bookings.map(async (b) => ({
      booking: b,
      item: await getBookedItem(b.item_type, b.item_id),
    })),
  );

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Welcome, {profile?.name ?? user.email}
          </h1>
          <p className="mt-1 text-stone-600">
            Your bookings, hosted trips, and reviews live here.
          </p>

          {/* Profile completeness nudge */}
          {profile && (!profile.bio || !profile.avatar_url || !profile.home_city) && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 ring-1 ring-inset ring-amber-200">
              <div>
                <p className="text-sm font-semibold text-amber-900">Complete your profile</p>
                <p className="text-xs text-amber-700">
                  Add a photo, bio, and home city — travellers trust hosts they can see.
                </p>
              </div>
              <Link
                href="/account/profile"
                className="shrink-0 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
              >
                Edit profile
              </Link>
            </div>
          )}

          {/* Quick links */}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 2 3-2h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
              </svg>
              Messages
            </Link>
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              Edit profile
            </Link>
            {!profile?.id_verified && (
              <Link
                href="/account/verify"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                🛡️ Verify your identity
              </Link>
            )}
            {profile?.id_verified && (
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
                🛡️ ID Verified
              </span>
            )}
            <Link
              href="/host/trips"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Your hosted trips →
            </Link>
          </div>

          <section className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="text-xl font-semibold text-ink">Your bookings</h2>
              <span className="text-sm text-stone-500">
                {bookings.length} total
              </span>
            </div>

            {enriched.length === 0 ? (
              <EmptyBookings />
            ) : (
              <div className="mt-5 grid gap-4">
                {enriched.map(({ booking, item }) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    item={item}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold text-ink">
              Your hosted trips
            </h2>
            <PanelStub body="Trips you've posted as a host will appear here once the host flow ships." />
          </section>

          <form action="/auth/logout" method="post" className="mt-12">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Log out
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function BookingRow({
  booking,
  item,
}: {
  booking: Booking;
  item: BookedItem | null;
}) {
  const reference = booking.id.slice(0, 8).toUpperCase();
  const isOriginals = booking.item_type === "package";
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="group flex items-stretch gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-28 sm:w-28">
        {item?.item.images[0] && (
          <Image
            src={item.item.images[0]}
            alt={item.item.title}
            fill
            sizes="112px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <Badge variant={isOriginals ? "originals" : "community"}>
            {isOriginals ? "Original" : "Community"}
          </Badge>
          <StatusChip status={booking.status} />
        </div>
        <div className="mt-1 truncate font-semibold text-ink group-hover:text-amber-700">
          {item?.item.title ?? "Trip details unavailable"}
        </div>
        <div className="mt-0.5 truncate text-xs text-stone-500">
          {item?.item.location ?? "-"}
          {item && (
            <>
              {" · "}
              {formatHumanDate(item.item.start_date)} · {item.item.days} days
            </>
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-3 text-sm">
          <span className="font-mono text-xs text-stone-400">{reference}</span>
          <span className="font-medium text-ink">
            {formatINR(Number(booking.total))}
          </span>
        </div>
      </div>
      <div className="hidden self-center pr-2 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block">
        →
      </div>
    </Link>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-200 text-stone-700 ring-stone-300",
    refunded: "bg-stone-200 text-stone-700 ring-stone-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
        styles[status] ?? styles.requested
      }`}
    >
      {status}
    </span>
  );
}

function EmptyBookings() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center sm:p-10">
      <div className="text-base font-semibold text-ink">No bookings yet</div>
      <p className="mt-1 text-sm text-stone-600">
        Find a curated package or join a community trip - both are one click
        away.
      </p>
      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Link
          href="/packages"
          className="inline-flex h-10 items-center justify-center rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
        >
          Browse packages
        </Link>
        <Link
          href="/trips"
          className="inline-flex h-10 items-center justify-center rounded-full bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          Community trips
        </Link>
      </div>
    </div>
  );
}

function PanelStub({ body }: { body: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-white p-6">
      <p className="text-sm text-stone-600">{body}</p>
    </div>
  );
}

function SupabaseNotConfigured() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)]">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Supabase not configured yet
            </h1>
            <p className="mt-2 text-stone-600">
              Add your Supabase URL and anon key to{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              and restart the dev server.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
