import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listAllPackagesForAdmin } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";

export const metadata = { title: "Originals · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminOriginalsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const [sp, rows] = await Promise.all([
    searchParams,
    listAllPackagesForAdmin(),
  ]);

  const byStatus = {
    live: rows.filter((r) => r.pkg.status === "live"),
    draft: rows.filter((r) => r.pkg.status === "draft"),
    archived: rows.filter((r) => r.pkg.status === "archived"),
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Originals"
        title="Manage Originals"
        description="Curated packages we run ourselves. Create, edit, publish, and track bookings."
        actions={
          <Link
            href="/admin/originals/new"
            className="inline-flex h-9 items-center rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + New package
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        {sp.deleted && (
          <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-100">
            Package deleted.
          </div>
        )}

        <SummaryStrip
          counts={{
            live: byStatus.live.length,
            draft: byStatus.draft.length,
            archived: byStatus.archived.length,
          }}
        />

        <div className="mt-6 space-y-10">
          <PackageGroup
            title="Live"
            accent="emerald"
            rows={byStatus.live}
            emptyHint="No live packages right now. Publish a draft or create a new one."
          />
          <PackageGroup
            title="Drafts"
            accent="amber"
            rows={byStatus.draft}
            emptyHint="No drafts."
          />
          {byStatus.archived.length > 0 && (
            <PackageGroup
              title="Archived"
              accent="stone"
              rows={byStatus.archived}
              emptyHint=""
            />
          )}
        </div>
      </div>
    </>
  );
}

function SummaryStrip({
  counts,
}: {
  counts: { live: number; draft: number; archived: number };
}) {
  const total = counts.live + counts.draft + counts.archived;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <SummaryCard label="Total" value={total} />
      <SummaryCard label="Live" value={counts.live} tone="emerald" />
      <SummaryCard label="Drafts" value={counts.draft} tone="amber" />
      <SummaryCard label="Archived" value={counts.archived} tone="stone" />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "stone",
}: {
  label: string;
  value: number;
  tone?: "stone" | "amber" | "emerald";
}) {
  const dot =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
        ? "bg-indigo-500"
        : "bg-stone-400";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          {label}
        </span>
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function PackageGroup({
  title,
  accent,
  rows,
  emptyHint,
}: {
  title: string;
  accent: "emerald" | "amber" | "stone";
  rows: { pkg: import("@/types/db").Package; bookingsCount: number; revenue: number }[];
  emptyHint: string;
}) {
  const dot =
    accent === "emerald"
      ? "bg-emerald-500"
      : accent === "amber"
        ? "bg-indigo-500"
        : "bg-stone-400";

  return (
    <section>
      <div className="flex items-baseline gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700">
          {title}
        </h2>
        <span className="text-xs text-stone-500">({rows.length})</span>
      </div>

      {rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
          {emptyHint}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Departs</th>
                <th className="px-4 py-3">Spots</th>
                <th className="px-4 py-3 text-right">Bookings</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map(({ pkg, bookingsCount, revenue }) => (
                <tr
                  key={pkg.id}
                  className="group transition-colors hover:bg-stone-50/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/originals/${pkg.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {pkg.images[0] && (
                          <Image
                            src={pkg.images[0]}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink group-hover:text-indigo-700">
                          {pkg.title}
                        </div>
                        <div className="truncate text-xs text-stone-500">
                          {pkg.location}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {formatHumanDate(pkg.start_date)}
                    <div className="text-xs text-stone-500">
                      {pkg.days} days
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {pkg.spots_total - pkg.spots_left}/{pkg.spots_total}{" "}
                    <span className="text-xs text-stone-500">filled</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                    {bookingsCount}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                    {formatINR(revenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/originals/${pkg.id}`}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-800"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
