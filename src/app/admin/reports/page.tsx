import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listReportsForAdmin } from "@/lib/supabase/queries";
import type { ReportCategory, ReportStatus } from "@/types/db";

export const metadata = { title: "Reports & safety · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

type SP = {
  status?: "any" | ReportStatus;
  category?: "any" | ReportCategory;
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rows = await listReportsForAdmin({
    status: sp.status,
    category: sp.category,
  });

  // Always-on summary uses unfiltered data.
  const all = await listReportsForAdmin({});
  const counts = {
    total: all.length,
    open: all.filter((r) => r.report.status === "open").length,
    investigating: all.filter((r) => r.report.status === "investigating").length,
    resolved: all.filter((r) => r.report.status === "resolved").length,
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Trust & safety"
        title="Reports & safety"
        description="Every report a traveller has filed. Treat this queue as urgent - trust depends on response time."
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <SummaryStrip counts={counts} />

        <div className="mt-6">
          <FilterRow current={sp} />
        </div>

        <div className="mt-4">
          {rows.length === 0 ? (
            <EmptyState filtered={Boolean(sp.status || sp.category)} />
          ) : (
            <ul className="grid gap-3">
              {rows.map(({ report, reporter, subject }) => (
                <li key={report.id}>
                  <Link
                    href={`/admin/reports/${report.id}`}
                    className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <CategoryIcon category={report.category} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryChip category={report.category} />
                        <StatusChip status={report.status} />
                        <span className="text-xs text-stone-500">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-stone-500">Against</span>{" "}
                        <span className="font-semibold text-ink">
                          {subject.title ?? "(unknown)"}
                        </span>{" "}
                        <span className="text-stone-500">
                          ({subject.type})
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-stone-700">
                        {report.description}
                      </p>
                      <div className="mt-2 text-xs text-stone-500">
                        Filed by{" "}
                        <span className="font-medium text-stone-700">
                          {reporter?.name ?? "Deleted user"}
                        </span>
                      </div>
                    </div>
                    <div className="hidden self-center text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:block">
                      →
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function FilterRow({ current }: { current: SP }) {
  return (
    <form
      action="/admin/reports"
      method="get"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]"
    >
      <select
        name="status"
        defaultValue={current.status ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All statuses</option>
        <option value="open">Open</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
      </select>
      <select
        name="category"
        defaultValue={current.category ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All categories</option>
        <option value="safety">Safety</option>
        <option value="harassment">Harassment</option>
        <option value="fraud">Fraud</option>
        <option value="other">Other</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-lg bg-yellow-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-yellow-700"
      >
        Filter
      </button>
      {(current.status || current.category) && (
        <Link
          href="/admin/reports"
          className="text-xs font-medium text-stone-500 hover:text-ink"
        >
          Clear
        </Link>
      )}
    </form>
  );
}

function SummaryStrip({
  counts,
}: {
  counts: {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Total" value={counts.total} />
      <SummaryCard label="Open" value={counts.open} tone="red" />
      <SummaryCard
        label="Investigating"
        value={counts.investigating}
        tone="amber"
      />
      <SummaryCard label="Resolved" value={counts.resolved} tone="emerald" />
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
  tone?: "stone" | "red" | "amber" | "emerald";
}) {
  const dot = {
    stone: "bg-stone-400",
    red: "bg-red-500",
    amber: "bg-yellow-500",
    emerald: "bg-emerald-500",
  }[tone];
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

function CategoryChip({ category }: { category: ReportCategory }) {
  const styles: Record<ReportCategory, string> = {
    safety: "bg-red-100 text-red-800 ring-red-200",
    harassment: "bg-red-100 text-red-800 ring-red-200",
    fraud: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    other: "bg-stone-100 text-stone-700 ring-stone-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[category]}`}
    >
      {category}
    </span>
  );
}

function StatusChip({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    open: "bg-red-100 text-red-800 ring-red-200",
    investigating: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    resolved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function CategoryIcon({ category }: { category: ReportCategory }) {
  const bg =
    category === "safety" || category === "harassment"
      ? "bg-red-100 text-red-700"
      : category === "fraud"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-stone-100 text-stone-700";
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${bg}`}
      aria-hidden
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
      <div className="text-base font-semibold text-ink">
        {filtered ? "No reports match those filters" : "All clear"}
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
        {filtered
          ? "Try widening the filters."
          : "No reports filed. Travellers can file from any trip or booking page."}
      </p>
    </div>
  );
}
