import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import type { Trip, TripStatus } from "@/types/db";

export const metadata = {
  title: "Your hosted trips · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = { submitted?: string; draft?: string };

export default async function HostTripsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/host/trips");
  }

  const sp = await searchParams;

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (trips ?? []) as Trip[];

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-800">
                Hosting
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Your trips
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Drafts, pending review, and live trips you&rsquo;ve hosted.
              </p>
            </div>
            <Link
              href="/host/new"
              className="inline-flex h-10 items-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-green-800"
            >
              + Post a trip
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <FlashBanner sp={sp} />

          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((trip) => (
                <li key={trip.id} className="min-w-0">
                  <TripRow trip={trip} highlight={sp.submitted === trip.id || sp.draft === trip.id} />
                </li>
              ))}
            </ul>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}

function TripRow({ trip, highlight }: { trip: Trip; highlight: boolean }) {
  // Every host trip now links into the host's detail page where they can
  // see status, admin feedback, edit, resubmit, or cancel.
  const href = `/host/trips/${trip.id}`;

  const body = (
    <>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-24 sm:w-24">
        {trip.images[0] && (
          <Image
            src={trip.images[0]}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="community">Community trip</Badge>
          <StatusChip status={trip.status} />
          {trip.admin_notes && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-200">
              Admin notes
            </span>
          )}
          {trip.rejection_reason && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 ring-1 ring-inset ring-red-200">
              Rejected - see reason
            </span>
          )}
        </div>
        <div className="mt-1 line-clamp-2 break-words font-semibold text-ink">
          {trip.title}
        </div>
        <div className="mt-0.5 truncate text-xs text-stone-500">
          {trip.location} · {formatHumanDate(trip.start_date)} · {trip.days} days
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-stone-500">
          <span className="whitespace-nowrap">
            {trip.spots_left}/{trip.spots_total} spots
          </span>
          <span className="whitespace-nowrap font-medium text-ink">
            {formatINR(Number(trip.price_per_share))} per share
          </span>
          <span className="whitespace-nowrap">
            Created{" "}
            {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
      <div className="hidden self-center pr-2 text-stone-400 sm:block">→</div>
    </>
  );

  return (
    <Link
      href={href}
      className={`group flex w-full min-w-0 items-stretch gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:gap-4 sm:p-4 ${
        highlight ? "ring-2 ring-inset ring-green-300" : ""
      }`}
    >
      {body}
    </Link>
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

function FlashBanner({ sp }: { sp: SP }) {
  if (sp.submitted) {
    return (
      <Banner variant="success">
        <strong className="font-semibold">Submitted for review.</strong>{" "}
        Packuptrip admin reviews within 24 hours. You&rsquo;ll see it move from{" "}
        <em className="not-italic font-semibold text-yellow-800">pending</em> to{" "}
        <em className="not-italic font-semibold text-emerald-800">live</em>{" "}
        when approved.
      </Banner>
    );
  }
  if (sp.draft) {
    return (
      <Banner variant="info">
        Draft saved. Only you can see it. Submit it for review when ready.
      </Banner>
    );
  }
  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "success" | "info";
  children: React.ReactNode;
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : "bg-stone-50 text-stone-700 ring-stone-200";
  return (
    <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${cls}`}>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="text-lg font-semibold text-ink">
        No trips yet
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
        Start by posting your first community trip. Save as a draft any
        time - only you can see drafts.
      </p>
      <Link
        href="/host/new"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-green-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-green-800"
      >
        Post your first trip →
      </Link>
    </div>
  );
}
