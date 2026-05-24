import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getAdminMetrics,
  getAdminRecentActivity,
  getOpenReportsCount,
  type AdminMetrics,
  type AdminActivityItem,
} from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Overview · Admin · Packuptrip" };

// Always fresh - the dashboard is read every time an admin lands on it.
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [metrics, activity, openReports] = await Promise.all([
    getAdminMetrics(),
    getAdminRecentActivity(12),
    getOpenReportsCount(),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin"
        title="Overview"
        description="Where the platform stands right now."
      />

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6 lg:px-8 lg:py-8">
        <KpiRow metrics={metrics} />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <RevenueSplit metrics={metrics} />
          <NeedsAttention metrics={metrics} openReports={openReports} />
        </div>
        <RecentActivity items={activity} />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI row                                                                    */
/* -------------------------------------------------------------------------- */

function KpiRow({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total bookings"
        value={metrics.totalBookings.toLocaleString("en-IN")}
        secondary={`${metrics.bookingsLast7d} in the last 7 days`}
      />
      <KpiCard
        label="Gross revenue"
        value={formatINR(metrics.grossRevenue)}
        secondary={`+${formatINR(metrics.revenueLast30d)} last 30 days`}
      />
      <KpiCard
        label="Active trips"
        value={(metrics.activePackages + metrics.activeTrips).toString()}
        secondary={`${metrics.activePackages} originals · ${metrics.activeTrips} community`}
      />
      <KpiCard
        label="Total users"
        value={metrics.totalUsers.toLocaleString("en-IN")}
        secondary={`${metrics.newSignups7d} joined this week`}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-ink">
        {value}
      </div>
      {secondary && (
        <div className="mt-1 text-xs text-stone-500">{secondary}</div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Revenue split                                                              */
/* -------------------------------------------------------------------------- */

function RevenueSplit({ metrics }: { metrics: AdminMetrics }) {
  const { originals, community } = metrics.revenueSplit;
  const total = originals + community;
  const originalsPct = total > 0 ? (originals / total) * 100 : 0;
  const communityPct = total > 0 ? (community / total) * 100 : 0;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Revenue split
          </div>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            Where it&rsquo;s coming from
          </h2>
        </div>
        <div className="text-xs text-stone-500">All-time gross</div>
      </div>

      {total === 0 ? (
        <div className="mt-6 rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-500">
          No bookings yet - once travellers start booking, you&rsquo;ll see the
          split here.
        </div>
      ) : (
        <>
          <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-stone-100">
            <div
              className="bg-amber-600 transition-all"
              style={{ width: `${originalsPct}%` }}
              aria-label={`${originalsPct.toFixed(0)}% Originals`}
            />
            <div
              className="bg-teal-600 transition-all"
              style={{ width: `${communityPct}%` }}
              aria-label={`${communityPct.toFixed(0)}% Community`}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <SplitRow
              dot="bg-amber-600"
              label="Packuptrip Originals"
              amount={originals}
              pct={originalsPct}
            />
            <SplitRow
              dot="bg-teal-600"
              label="Community Trips"
              amount={community}
              pct={communityPct}
            />
          </div>
        </>
      )}
    </section>
  );
}

function SplitRow({
  dot,
  label,
  amount,
  pct,
}: {
  dot: string;
  label: string;
  amount: number;
  pct: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-stone-600">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-ink">
        {formatINR(amount)}
      </div>
      <div className="text-[11px] text-stone-500">{pct.toFixed(0)}% of gross</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Needs attention                                                            */
/* -------------------------------------------------------------------------- */

function NeedsAttention({
  metrics,
  openReports,
}: {
  metrics: AdminMetrics;
  openReports: number;
}) {
  const items: Array<{
    label: string;
    count: number;
    href: string;
    urgent?: boolean;
    note?: string;
  }> = [
    {
      label: "Pending trip approvals",
      count: metrics.pendingTrips,
      href: "/admin/approvals",
    },
    {
      label: "Open safety reports",
      count: openReports,
      href: "/admin/reports",
      urgent: true,
    },
    {
      label: "Pending host payouts",
      count: 0,
      href: "/admin/originals",
      note: "Live with Epic 7 (Payments)",
    },
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Needs attention
      </div>
      <h2 className="mt-1 text-lg font-semibold text-ink">Action queue</h2>

      <ul className="mt-5 divide-y divide-stone-100">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              className="group flex items-center justify-between gap-3 py-3 transition-colors hover:bg-stone-50/50 -mx-2 px-2 rounded-lg"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {it.urgent && it.count > 0 && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                    />
                  )}
                  <span className="text-sm font-medium text-ink">
                    {it.label}
                  </span>
                </div>
                {it.note && (
                  <div className="mt-0.5 text-[11px] text-stone-400">
                    {it.note}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    it.count > 0
                      ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                      : "text-xs font-medium text-stone-400"
                  }
                >
                  {it.count}
                </span>
                <span className="text-stone-300 transition-colors group-hover:text-stone-500">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Recent activity                                                            */
/* -------------------------------------------------------------------------- */

function RecentActivity({ items }: { items: AdminActivityItem[] }) {
  return (
    <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-stone-100 px-6 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Recent activity
        </div>
        <h2 className="mt-1 text-lg font-semibold text-ink">
          Latest on the platform
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-stone-500">
          Nothing&rsquo;s happened yet. Activity will appear here as travellers
          sign up and book trips.
        </div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityRow({ item }: { item: AdminActivityItem }) {
  const isBooking = item.kind === "booking";
  const inner = (
    <div className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-stone-50/60">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          isBooking
            ? "bg-amber-100 text-amber-700"
            : "bg-teal-100 text-teal-700"
        }`}
        aria-hidden
      >
        {isBooking ? <BookmarkIcon /> : <UserPlusIcon />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-ink">
          <span className="font-semibold">{item.who}</span>{" "}
          <span className="text-stone-600">{item.description}</span>
        </div>
        <div className="text-xs text-stone-500">
          {relativeTime(item.timestamp)}
        </div>
      </div>
      {item.amount != null && (
        <div className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {formatINR(item.amount)}
        </div>
      )}
    </div>
  );
  return (
    <li>
      {item.href ? (
        <Link href={item.href} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </li>
  );
}

function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

function BookmarkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
