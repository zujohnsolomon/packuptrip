import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getBookingForAdmin } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import { BookingActions } from "./BookingActions";

export const metadata = { title: "Booking · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string; refunded?: string }>;
}) {
  const [{ id }, sp, res] = await Promise.all([
    params,
    searchParams,
    (async () => {
      const { id } = await params;
      return getBookingForAdmin(id);
    })(),
  ]);
  if (!res) notFound();

  const {
    booking,
    user,
    itemTitle,
    itemType,
    itemId,
    itemImage,
    itemLocation,
    itemStartDate,
  } = res;
  const reference = booking.id.slice(0, 8).toUpperCase();

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Booking"
        title={itemTitle ?? "Unknown trip"}
        description={`${reference} · ${user?.name ?? "Deleted user"}`}
        actions={
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to bookings
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <FlashBanner sp={sp} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {/* Trip block */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="relative aspect-[16/9] w-full bg-stone-100">
                {itemImage && (
                  <Image
                    src={itemImage}
                    alt={itemTitle ?? ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                  />
                )}
                <span
                  className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    itemType === "package"
                      ? "bg-amber-100 text-amber-800 ring-amber-200"
                      : "bg-teal-100 text-teal-800 ring-teal-200"
                  }`}
                >
                  {itemType === "package" ? "Packuptrip Original" : "Community trip"}
                </span>
              </div>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-ink">
                  {itemTitle ?? "Unknown trip"}
                </h2>
                {itemLocation && (
                  <p className="mt-0.5 text-sm text-stone-500">{itemLocation}</p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4">
                  {itemStartDate && (
                    <Stat
                      label="Trip departs"
                      value={formatHumanDate(itemStartDate)}
                    />
                  )}
                  <Stat
                    label="Booked"
                    value={formatDistanceToNow(new Date(booking.created_at), {
                      addSuffix: true,
                    })}
                  />
                  <Stat label="Reference" value={reference} />
                  <Stat label="Booking type" value={itemType} />
                </dl>
                <div className="mt-4 flex gap-3">
                  <Link
                    href={
                      itemType === "package"
                        ? `/admin/originals/${itemId}`
                        : `/admin/approvals/${itemId}`
                    }
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    View item in admin →
                  </Link>
                  <Link
                    href={
                      itemType === "package"
                        ? `/packages/${itemId}`
                        : `/trips/${itemId}`
                    }
                    target="_blank"
                    className="text-xs font-semibold text-stone-600 hover:text-ink"
                  >
                    View public page →
                  </Link>
                </div>
              </div>
            </section>

            {/* Price breakdown */}
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-base font-semibold text-ink">
                Price breakdown
              </h3>
              <dl className="mt-4 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
                <Row
                  label="Trip price"
                  value={formatINR(Number(booking.base_price))}
                />
                <Row
                  label="Packuptrip service fee"
                  value={formatINR(Number(booking.service_fee))}
                />
                <div className="my-1 h-px bg-stone-200" />
                <Row
                  label="Total"
                  value={formatINR(Number(booking.total))}
                  bold
                />
              </dl>
              <p className="mt-3 text-xs text-stone-500">
                These values are immutable on this row - service fee was
                computed at the rate live when the booking was created.
              </p>
            </section>

            {/* Traveller block */}
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Traveller
              </div>
              {user ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-100 text-base font-semibold text-amber-800">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">
                      {user.name}
                    </div>
                    <div className="truncate text-sm text-stone-500">
                      {user.email}
                    </div>
                  </div>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Manage user →
                  </Link>
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  This user has been deleted. The booking remains in the
                  record but can&rsquo;t be linked.
                </p>
              )}
            </section>
          </div>

          {/* Actions sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <BookingActions
              bookingId={booking.id}
              status={booking.status}
              total={Number(booking.total)}
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

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-stone-600"}>
        {label}
      </span>
      <span className={bold ? "font-semibold text-ink" : "text-stone-700"}>
        {value}
      </span>
    </div>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { cancelled?: string; refunded?: string };
}) {
  if (sp.cancelled) {
    return (
      <Banner variant="info">
        Booking cancelled. Spot has been freed on the trip.
      </Banner>
    );
  }
  if (sp.refunded) {
    return (
      <Banner variant="warning">
        Booking marked as refunded. Money movement happens via the payments
        admin (post-Epic 7).
      </Banner>
    );
  }
  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "info" | "warning";
  children: React.ReactNode;
}) {
  const cls =
    variant === "warning"
      ? "bg-amber-50 text-amber-800 ring-amber-100"
      : "bg-stone-50 text-stone-700 ring-stone-200";
  return (
    <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${cls}`}>
      {children}
    </div>
  );
}
