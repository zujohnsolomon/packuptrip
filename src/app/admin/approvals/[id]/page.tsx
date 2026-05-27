import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Itinerary } from "@/components/detail/Itinerary";
import { Inclusions } from "@/components/detail/Inclusions";
import { getTripForReview } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import { ApprovalPanel } from "./ApprovalPanel";

export const metadata = { title: "Review trip · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminApprovalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, sp, res] = await Promise.all([
    params,
    searchParams,
    (async () => {
      const { id } = await params;
      return getTripForReview(id);
    })(),
  ]);
  if (!res) notFound();
  const { trip, host } = res;

  // If the trip's not pending anymore (already approved/rejected by another
  // admin in another tab), show a clear state instead of letting them act
  // on a stale view.
  const isPending = trip.status === "pending";

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Trip review"
        title={trip.title}
        description={`Hosted by ${host?.name ?? "Unknown"} · Submitted ${formatDistanceToNow(
          new Date(trip.created_at),
          { addSuffix: true },
        )}`}
        actions={
          <Link
            href="/admin/approvals"
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to queue
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        {sp.saved && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-100">
            Changes saved. Trip is still pending review.
          </div>
        )}
        {!isPending && (
          <div className="mb-5 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-400 ring-1 ring-inset ring-yellow-100">
            This trip is no longer pending - current status:{" "}
            <strong className="font-semibold">{trip.status}</strong>. No further
            actions available here.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Preview - exactly what the traveller will see */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="relative aspect-[16/9] w-full bg-stone-100">
                {trip.images[0] && (
                  <Image
                    src={trip.images[0]}
                    alt={trip.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                  />
                )}
                <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-900 ring-1 ring-inset ring-green-200">
                  Community trip
                </span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-ink">{trip.title}</h2>
                <p className="mt-0.5 text-sm text-stone-500">{trip.location}</p>

                {trip.description && (
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-stone-700">
                    {trip.description}
                  </p>
                )}

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-stone-100 pt-5 text-sm sm:grid-cols-4">
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
                </dl>
              </div>
            </div>

            {trip.images.length > 1 && (
              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-semibold text-ink">
                  All photos ({trip.images.length})
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Hero is the first image. Review every photo before approving.
                </p>
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
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        t === "__seed_test_data"
                          ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Action panel - sticky on desktop */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {host && <HostCard host={host} />}
            {trip.admin_notes && (
              <NotesShown
                title="Your notes to host"
                body={trip.admin_notes}
                tone="info"
              />
            )}
            {trip.rejection_reason && (
              <NotesShown
                title="Last rejection reason"
                body={trip.rejection_reason}
                tone="warning"
              />
            )}
            <ApprovalPanel tripId={trip.id} disabled={!isPending} />
            <Link
              href={`/admin/approvals/${trip.id}/edit`}
              className={`mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-50 ${
                !isPending ? "pointer-events-none opacity-50" : ""
              }`}
            >
              Edit trip before approving →
            </Link>
          </aside>
        </div>
      </div>
    </>
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

function HostCard({
  host,
}: {
  host: { name: string; email: string; id_verified: boolean; created_at: string };
}) {
  return (
    <div className="mb-3 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Host
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-sm font-semibold text-green-900">
          {host.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">
            {host.name}
          </div>
          <div className="truncate text-xs text-stone-500">{host.email}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {host.id_verified ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
            ID verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">
            Not ID verified
          </span>
        )}
        <span className="text-stone-500">
          Joined{" "}
          {formatDistanceToNow(new Date(host.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function NotesShown({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "info" | "warning";
}) {
  const cls =
    tone === "warning"
      ? "bg-yellow-50 ring-yellow-100 text-yellow-500"
      : "bg-stone-50 ring-stone-200 text-stone-700";
  return (
    <div className={`mb-3 rounded-2xl p-4 ring-1 ring-inset ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em]">
        {title}
      </div>
      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  );
}
