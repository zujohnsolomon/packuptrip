import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listAllTripsForAdmin, adminSetTripStatus } from "@/lib/supabase/queries";
import type { TripStatus } from "@/types/db";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Community Trips · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "any",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "live",      label: "Live" },
  { value: "draft",     label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<TripStatus, string> = {
  draft:     "bg-stone-100 text-stone-600",
  pending:   "bg-indigo-100 text-indigo-800",
  live:      "bg-green-100 text-green-900",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-700",
};

type SP = { q?: string; status?: string };

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rows = await listAllTripsForAdmin({ q: sp.q, status: sp.status });

  const counts = {
    all:       rows.length,
    pending:   rows.filter((r) => r.trip.status === "pending").length,
    live:      rows.filter((r) => r.trip.status === "live").length,
    draft:     rows.filter((r) => r.trip.status === "draft").length,
    completed: rows.filter((r) => r.trip.status === "completed").length,
    cancelled: rows.filter((r) => r.trip.status === "cancelled").length,
  };

  async function takeDown(formData: FormData) {
    "use server";
    const id = String(formData.get("tripId"));
    await adminSetTripStatus(id, "cancelled");
    revalidatePath("/admin/trips");
  }

  async function reinstate(formData: FormData) {
    "use server";
    const id = String(formData.get("tripId"));
    await adminSetTripStatus(id, "pending");
    revalidatePath("/admin/trips");
  }

  async function publish(formData: FormData) {
    "use server";
    const id = String(formData.get("tripId"));
    await adminSetTripStatus(id, "live");
    revalidatePath("/admin/trips");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Community Trips"
        title="Community Trips"
        description="All host-created trips. Manage status, take down live trips, reinstate cancelled ones."
        actions={
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
            {rows.length} trips
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: "Total",     value: counts.all },
            { label: "Pending",   value: counts.pending,   color: "text-indigo-700" },
            { label: "Live",      value: counts.live,      color: "text-green-800" },
            { label: "Draft",     value: counts.draft },
            { label: "Completed", value: counts.completed, color: "text-blue-700" },
            { label: "Cancelled", value: counts.cancelled, color: "text-red-700" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{s.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${s.color ?? "text-ink"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form method="GET" className="flex-1">
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Search title or location…"
              className="w-full max-w-xs rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
          </form>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/trips?status=${opt.value}${sp.q ? `&q=${sp.q}` : ""}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  (sp.status ?? "any") === opt.value
                    ? "bg-indigo-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-[var(--shadow-card)]">
          {rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">No trips found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">Trip</th>
                  <th className="px-4 py-3 text-left">Host</th>
                  <th className="px-4 py-3 text-left">Dates</th>
                  <th className="px-4 py-3 text-left">Spots</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map(({ trip, host }) => (
                  <tr key={trip.id} className="hover:bg-stone-50/50">
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate font-medium text-ink">{trip.title}</p>
                      <p className="truncate text-xs text-stone-400">{trip.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      {host ? (
                        <Link href={`/admin/users?q=${host.email}`} className="text-xs text-indigo-700 hover:underline">
                          {host.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {new Date(trip.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="ml-1 text-stone-400">· {trip.days}d</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {trip.spots_left}/{trip.spots_total}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[trip.status]}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/trips/${trip.id}`}
                          target="_blank"
                          className="text-xs text-stone-500 hover:text-ink"
                        >
                          View
                        </Link>
                        {trip.status === "pending" && (
                          <Link
                            href={`/admin/approvals/${trip.id}`}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                          >
                            Review
                          </Link>
                        )}
                        {trip.status === "live" && (
                          <form action={takeDown}>
                            <input type="hidden" name="tripId" value={trip.id} />
                            <button className="text-xs font-semibold text-red-600 hover:text-red-800">
                              Take down
                            </button>
                          </form>
                        )}
                        {trip.status === "cancelled" && (
                          <form action={reinstate}>
                            <input type="hidden" name="tripId" value={trip.id} />
                            <button className="text-xs font-semibold text-green-800 hover:text-green-950">
                              Reinstate
                            </button>
                          </form>
                        )}
                        {trip.status === "draft" && (
                          <form action={publish}>
                            <input type="hidden" name="tripId" value={trip.id} />
                            <button className="text-xs font-semibold text-green-800 hover:text-green-950">
                              Force publish
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
