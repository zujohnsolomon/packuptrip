import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listPendingTrips } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";

export const metadata = { title: "Trip approvals · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; rejected?: string; notes?: string }>;
}) {
  const [sp, pending] = await Promise.all([searchParams, listPendingTrips()]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Moderation"
        title="Trip approvals"
        description="Community trips waiting for review. Oldest first - be fair to the host who's been waiting longest."
        actions={
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-400">
            {pending.length} pending
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <FlashBanner sp={sp} />

        {pending.length === 0 ? (
          <EmptyQueue />
        ) : (
          <ul className="grid gap-4">
            {pending.map(({ trip, host }) => {
              const isSeedData = trip.tags.includes("__seed_test_data");
              const hasNotes = Boolean(trip.admin_notes);
              return (
                <li key={trip.id}>
                  <Link
                    href={`/admin/approvals/${trip.id}`}
                    className="group flex items-stretch gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-stone-100 sm:h-32 sm:w-32">
                      {trip.images[0] && (
                        <Image
                          src={trip.images[0]}
                          alt={trip.title}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900 ring-1 ring-inset ring-green-200">
                          Community trip
                        </span>
                        {hasNotes && (
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                            Changes requested
                          </span>
                        )}
                        {isSeedData && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                            TEST DATA
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate font-semibold text-ink group-hover:text-yellow-500">
                        {trip.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-stone-500">
                        {trip.location} · {formatHumanDate(trip.start_date)} ·{" "}
                        {trip.days} days
                      </div>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-stone-500">
                        <span>
                          Hosted by{" "}
                          <span className="font-medium text-ink">
                            {host?.name ?? "Unknown"}
                          </span>
                        </span>
                        <span>
                          {trip.spots_left}/{trip.spots_total} spots
                        </span>
                        <span className="font-medium text-ink">
                          {formatINR(Number(trip.price_per_share))} per share
                        </span>
                        <span>
                          Submitted{" "}
                          {formatDistanceToNow(new Date(trip.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="hidden self-center pr-2 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block">
                      Review →
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { approved?: string; rejected?: string; notes?: string };
}) {
  if (sp.approved) {
    return (
      <Banner variant="success">
        Trip approved and published. Travellers can now find it on{" "}
        <Link href="/trips" className="font-semibold underline-offset-2 hover:underline">
          /trips
        </Link>
        .
      </Banner>
    );
  }
  if (sp.rejected) {
    return (
      <Banner variant="warning">
        Trip rejected - the host can edit and resubmit. They&rsquo;ll see your
        reason on their dashboard.
      </Banner>
    );
  }
  if (sp.notes) {
    return (
      <Banner variant="info">
        Changes requested. The trip stays in this queue until the host edits
        and resubmits.
      </Banner>
    );
  }
  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "success" | "warning" | "info";
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, string> = {
    success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    warning: "bg-yellow-50 text-yellow-400 ring-yellow-100",
    info: "bg-stone-50 text-stone-700 ring-stone-200",
  };
  return (
    <div
      className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${styles[variant]}`}
    >
      {children}
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="text-lg font-semibold text-ink">Queue is clear</div>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
        No trips waiting for review. New host submissions land here when the
        host flow ships (Epic 6).
      </p>
    </div>
  );
}
