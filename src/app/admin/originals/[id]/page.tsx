import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getPackageWithBookings } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import { StatusActions } from "./StatusActions";

export const metadata = { title: "Package · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminPackageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; status?: string }>;
}) {
  const [{ id }, sp, res] = await Promise.all([
    params,
    searchParams,
    (async () => {
      const { id } = await params;
      return getPackageWithBookings(id);
    })(),
  ]);
  if (!res) notFound();
  const { pkg, bookings } = res;

  const revenue = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "refunded")
    .reduce((s, b) => s + b.total, 0);
  const filled = pkg.spots_total - pkg.spots_left;

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Originals"
        title={pkg.title}
        description={pkg.location}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/packages/${pkg.id}`}
              target="_blank"
              className="text-sm font-medium text-stone-600 hover:text-ink"
            >
              View live →
            </Link>
            <Link
              href={`/admin/originals/${pkg.id}/edit`}
              className="inline-flex h-9 items-center rounded-full bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Edit
            </Link>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <FlashBanner sp={sp} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: package preview + bookings */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="relative aspect-[16/9] w-full bg-stone-100">
                {pkg.images[0] && (
                  <Image
                    src={pkg.images[0]}
                    alt={pkg.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                  />
                )}
                <StatusRibbon status={pkg.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                <Stat label="Departs" value={formatHumanDate(pkg.start_date)} />
                <Stat label="Duration" value={`${pkg.days} days`} />
                <Stat label="Price" value={formatINR(Number(pkg.price))} />
                <Stat
                  label="Spots filled"
                  value={`${filled}/${pkg.spots_total}`}
                />
              </div>
            </div>

            <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="border-b border-stone-100 px-6 py-4 flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Bookings
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-ink">
                    {bookings.length === 0
                      ? "No bookings yet"
                      : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
                  </h2>
                </div>
                <div className="text-sm">
                  <span className="text-stone-500">Revenue: </span>
                  <span className="font-semibold text-ink">
                    {formatINR(revenue)}
                  </span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-stone-500">
                  Nobody has booked this package yet. Once they do, you&rsquo;ll
                  see the traveller list here.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {bookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {b.user?.name ?? "Unknown traveller"}
                        </div>
                        <div className="truncate text-xs text-stone-500">
                          {b.user?.email ?? "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span>
                          {formatDistanceToNow(new Date(b.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <StatusChip status={b.status} />
                        <span className="font-medium text-ink tabular-nums">
                          {formatINR(b.total)}
                        </span>
                        <Link
                          href={`/bookings/${b.id}`}
                          target="_blank"
                          className="text-stone-400 hover:text-ink"
                        >
                          →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {pkg.description && (
              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-semibold text-ink">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {pkg.description}
                </p>
              </section>
            )}

            {pkg.itinerary && pkg.itinerary.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-semibold text-ink">Itinerary</h3>
                <ol className="mt-3 space-y-2 text-sm">
                  {pkg.itinerary.map((d, i) => (
                    <li key={i}>
                      <span className="font-semibold text-ink">
                        Day {d.day}:
                      </span>{" "}
                      <span className="text-ink">{d.title}</span>
                      {d.description && (
                        <span className="text-stone-600"> - {d.description}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Right: actions */}
          <aside className="lg:sticky lg:top-6 lg:self-start space-y-3">
            <StatusActions
              id={pkg.id}
              status={pkg.status}
              featured={pkg.featured}
              hasBookings={bookings.length > 0}
            />
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

function StatusRibbon({ status }: { status: string }) {
  const cls =
    status === "live"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : status === "draft"
        ? "bg-indigo-100 text-indigo-800 ring-indigo-200"
        : "bg-stone-200 text-stone-700 ring-stone-300";
  return (
    <span
      className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-indigo-100 text-indigo-800 ring-indigo-200",
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

function FlashBanner({
  sp,
}: {
  sp: { created?: string; saved?: string; status?: string; featured?: string };
}) {
  if (sp.created) {
    return (
      <Banner variant="success">Package created. Switch status to "Live" when ready.</Banner>
    );
  }
  if (sp.saved) {
    return <Banner variant="success">Changes saved.</Banner>;
  }
  if (sp.status === "live") {
    return <Banner variant="success">Published. Travellers can find it now.</Banner>;
  }
  if (sp.status === "draft") {
    return <Banner variant="info">Unpublished - no longer visible to travellers.</Banner>;
  }
  if (sp.status === "archived") {
    return <Banner variant="info">Archived. Hidden from listings.</Banner>;
  }
  if (sp.featured === "true") {
    return <Banner variant="success">Featured on the homepage hero strip.</Banner>;
  }
  if (sp.featured === "false") {
    return <Banner variant="info">Removed from the homepage hero strip.</Banner>;
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
