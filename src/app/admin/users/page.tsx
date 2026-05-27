import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listUsersForAdmin } from "@/lib/supabase/queries";
import type { UserRole } from "@/types/db";

export const metadata = { title: "Users · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

type SP = {
  q?: string;
  role?: UserRole | "any";
  status?: "any" | "verified" | "unverified" | "suspended";
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rows = await listUsersForAdmin({
    q: sp.q,
    role: sp.role,
    status: sp.status,
  });

  // Aggregate counts for the summary strip use unfiltered data - fetch once
  // more without filters. Cheap on small N; if it grows, switch to RPC.
  const all = await listUsersForAdmin({});
  const counts = {
    total: all.length,
    admins: all.filter((r) => r.profile.role === "admin").length,
    hosts: all.filter((r) => r.profile.role === "host").length,
    travellers: all.filter((r) => r.profile.role === "traveller").length,
    verified: all.filter((r) => r.profile.id_verified).length,
    suspended: all.filter((r) => r.profile.suspension_reason).length,
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Users"
        title="Users"
        description="Search travellers and hosts, manage roles, run the ID-verification queue, and moderate accounts."
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <SummaryStrip counts={counts} />

        <div className="mt-6">
          <FilterRow current={sp} />
        </div>

        <div className="mt-4">
          {rows.length === 0 ? (
            <EmptyState filtered={Boolean(sp.q || sp.role || sp.status)} />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead className="border-b border-stone-100 bg-stone-50 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Bookings</th>
                    <th className="px-4 py-3 text-right">Hosted</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map(({ profile, bookingsCount, hostedTripsCount }) => (
                    <tr
                      key={profile.id}
                      className="group transition-colors hover:bg-stone-50/60"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${profile.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
                            {profile.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ink group-hover:text-indigo-700">
                              {profile.name}
                            </div>
                            <div className="truncate text-xs text-stone-500">
                              {profile.email}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <RoleChip role={profile.role} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {profile.suspension_reason && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 ring-1 ring-inset ring-red-200">
                              Suspended
                            </span>
                          )}
                          {profile.id_verified ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                              ID verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700 ring-1 ring-inset ring-stone-200">
                              Not verified
                            </span>
                          )}
                          {(profile as { plus_member?: boolean }).plus_member && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900 ring-1 ring-inset ring-green-200">
                              ✦ Plus
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                        {bookingsCount}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                        {hostedTripsCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {formatDistanceToNow(new Date(profile.created_at), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/users/${profile.id}`}
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
        </div>
      </div>
    </>
  );
}

function FilterRow({ current }: { current: SP }) {
  return (
    <form
      action="/admin/users"
      method="get"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-card)]"
    >
      <input
        type="search"
        name="q"
        defaultValue={current.q ?? ""}
        placeholder="Search name or email…"
        className="h-9 flex-1 min-w-[200px] rounded-lg border border-stone-200 bg-white px-3 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <select
        name="role"
        defaultValue={current.role ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All roles</option>
        <option value="traveller">Travellers</option>
        <option value="host">Hosts</option>
        <option value="admin">Admins</option>
      </select>
      <select
        name="status"
        defaultValue={current.status ?? "any"}
        className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
      >
        <option value="any">All statuses</option>
        <option value="verified">ID verified</option>
        <option value="unverified">Not verified</option>
        <option value="suspended">Suspended</option>
      </select>
      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
      >
        Filter
      </button>
      {(current.q || current.role || current.status) && (
        <Link
          href="/admin/users"
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
    admins: number;
    hosts: number;
    travellers: number;
    verified: number;
    suspended: number;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard label="Total" value={counts.total} />
      <SummaryCard label="Travellers" value={counts.travellers} />
      <SummaryCard label="Hosts" value={counts.hosts} tone="teal" />
      <SummaryCard label="Admins" value={counts.admins} tone="amber" />
      <SummaryCard label="ID verified" value={counts.verified} tone="emerald" />
      <SummaryCard label="Suspended" value={counts.suspended} tone="red" />
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
  tone?: "stone" | "amber" | "teal" | "emerald" | "red";
}) {
  const dot = {
    stone: "bg-stone-400",
    amber: "bg-indigo-500",
    teal: "bg-green-600",
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
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function RoleChip({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    traveller: "bg-stone-100 text-stone-700 ring-stone-200",
    host: "bg-green-100 text-green-900 ring-green-200",
    admin: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <div className="text-base font-semibold text-ink">
        {filtered ? "No users match those filters" : "No users yet"}
      </div>
      <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">
        {filtered
          ? "Try widening the filters or clearing the search."
          : "Users appear here as soon as anyone signs up."}
      </p>
      {filtered && (
        <Link
          href="/admin/users"
          className="mt-5 inline-flex h-9 items-center rounded-full bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
