import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listBookingsForAdmin } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Bookings · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  status?: "any" | "requested" | "confirmed" | "cancelled" | "refunded";
  itemType?: "any" | "package" | "trip";
  from?: string;
  to?: string;
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rows = await listBookingsForAdmin({
    q: sp.q,
    status: sp.status,
    itemType: sp.itemType,
    from: sp.from,
    to: sp.to,
  });

  const totals = rows.reduce(
    (acc, r) => {
      const t = Number(r.booking.total);
      acc.gross += t;
      if (r.booking.status === "requested") acc.reserved += t;
      if (r.booking.status === "confirmed") acc.captured += t;
      if (r.booking.status === "refunded") acc.refunded += t;
      return acc;
    },
    { gross: 0, reserved: 0, captured: 0, refunded: 0 },
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Bookings"
        title="Bookings"
        description="Every booking across Originals and Community Trips. Filter, inspect, cancel, refund."
        actions={
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
            {rows.length} matching
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <SummaryStrip totals={totals} count={rows.length} />

        <div className="mt-6">
          <FilterRow current={sp} />
        </div>

        <div className="mt-4">
          {rows.length === 0 ? (
            <EmptyState filtered={Boolean(sp.q || sp.status || sp.itemType || sp.from || sp.to)} />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-100 bg-stone-50 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Traveller</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Booked</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map(({ booking, user, itemTitle }) => {
                    const ref = booking.id.slice(0, 8).toUpperCase();
                    return (
                      <tr
                        key={booking.id}
                        className="group transition-colors hover:bg-stone-50/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="block"
                          >
                            <div className="truncate font-medium text-ink group-hover:text-yellow-700">
                              {itemTitle ?? "Unknown trip"}
                            </div>
                            <div className="font-mono text-[10px] text-stone-400">
                              {ref}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {user ? (
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="block text-stone-700 hover:text-ink"
                            >
                              <div className="truncate font-medium">
                                {user.name}
                              </div>
                              <div className="truncate text-xs text-stone-500">
                                {user.email}
                              </div>
                            </Link>
                          ) : (
                            <span className="text-stone-400">Deleted user</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ItemTypeChip type={booking.item_type} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={booking.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                          {formatINR(Number(booking.total))}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500">
                          {formatDistanceToNow(new Date(booking.created_at), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterRow({ current }: { current: SP }) {
  return (
    <form
      action="/admin/bookings"
      method="get"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search ref, traveller, trip…"
        className="h-9 flex-1 min-w-[200px] rounded-lg border border-stone-200 bg-white px-3 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100"
      />
      <select
        name="status"
        defaultValue={current.status ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All statuses</option>
        <option value="requested">Requested</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>
      <select
        name="itemType"
        defaultValue={current.itemType ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All types</option>
        <option value="package">Originals</option>
        <option value="trip">Community</option>
      </select>
      <label className="text-xs text-stone-500">
        From
        <input
          type="date"
          name="from"
          defaultValue={current.from ?? ""}
          className="ml-1 h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm text-stone-700"
        />
      </label>
      <label className="text-xs text-stone-500">
        To
        <input
          type="date"
          name="to"
          defaultValue={current.to ?? ""}
          className="ml-1 h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm text-stone-700"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-lg bg-yellow-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
      >
        Filter
      </button>
      {(current.q ||
        current.status ||
        current.itemType ||
        current.from ||
        current.to) && (
        <Link
          href="/admin/bookings"
          className="text-xs font-medium text-stone-500 hover:text-ink"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

function SummaryStrip({
  totals,
  count,
}: {
  totals: { gross: number; reserved: number; captured: number; refunded: number };
  count: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard label="Bookings" value={String(count)} tone="stone" />
      <SummaryCard label="Gross" value={formatINR(totals.gross)} tone="stone" />
      <SummaryCard
        label="Reserved"
        value={formatINR(totals.reserved)}
        tone="amber"
        hint="Not yet captured"
      />
      <SummaryCard
        label="Captured"
        value={formatINR(totals.captured)}
        tone="emerald"
        hint="Real revenue"
      />
      <SummaryCard
        label="Refunded"
        value={formatINR(totals.refunded)}
        tone="red"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "stone",
  hint,
}: {
  label: string;
  value: string;
  tone?: "stone" | "amber" | "emerald" | "red";
  hint?: string;
}) {
  const dot = {
    stone: "bg-stone-400",
    amber: "bg-yellow-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  }[tone];
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </span>
      </div>
      <div className="mt-1 text-xl font-semibold text-ink tabular-nums">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-stone-500">{hint}</div>}
    </div>
  );
}

function ItemTypeChip({ type }: { type: "package" | "trip" }) {
  const cls =
    type === "package"
      ? "bg-yellow-100 text-yellow-800 ring-yellow-200"
      : "bg-green-100 text-green-900 ring-green-200";
  const label = type === "package" ? "Original" : "Community";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-200 text-stone-700 ring-stone-300",
    refunded: "bg-red-100 text-red-800 ring-red-200",
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

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <div className="text-base font-semibold text-ink">
        {filtered ? "No bookings match those filters" : "No bookings yet"}
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
        {filtered
          ? "Try widening the date range, clearing the search, or switching status."
          : "Bookings appear here as travellers reserve spots."}
      </p>
      {filtered && (
        <Link
          href="/admin/bookings"
          className="mt-5 inline-flex h-9 items-center rounded-full bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
