import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listHostsForAdmin,
  adminSetHostTier,
} from "@/lib/supabase/queries";
import type { Profile } from "@/types/db";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Hosts · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

const TIER_OPTIONS = [
  { value: "any",       label: "All" },
  { value: "standard",  label: "Standard" },
  { value: "superhost", label: "Superhost" },
  { value: "flagged",   label: "Flagged" },
];

const TIER_BADGE: Record<Profile["host_tier"], string> = {
  standard:  "bg-stone-100 text-stone-600",
  superhost: "bg-yellow-100 text-yellow-400",
  flagged:   "bg-red-100 text-red-700",
};

type SP = { q?: string; tier?: string };

export default async function AdminHostsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const rows = await listHostsForAdmin({ q: sp.q, tier: sp.tier });

  const counts = {
    all:       rows.length,
    standard:  rows.filter((r) => r.profile.host_tier === "standard").length,
    superhost: rows.filter((r) => r.profile.host_tier === "superhost").length,
    flagged:   rows.filter((r) => r.profile.host_tier === "flagged").length,
  };

  async function setTier(formData: FormData) {
    "use server";
    const userId = String(formData.get("userId"));
    const tier = String(formData.get("tier")) as Profile["host_tier"];
    await adminSetHostTier(userId, tier);
    revalidatePath("/admin/hosts");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Hosts"
        title="Hosts"
        description="All users who have posted at least one trip. Manage tier badges."
        actions={
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-400">
            {rows.length} hosts
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",     value: counts.all },
            { label: "Standard",  value: counts.standard },
            { label: "Superhost", value: counts.superhost, color: "text-yellow-500" },
            { label: "Flagged",   value: counts.flagged,   color: "text-red-700" },
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
              placeholder="Search name or email…"
              className="w-full max-w-xs rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
            {sp.tier && <input type="hidden" name="tier" value={sp.tier} />}
          </form>
          <div className="flex flex-wrap gap-1.5">
            {TIER_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/hosts?tier=${opt.value}${sp.q ? `&q=${sp.q}` : ""}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  (sp.tier ?? "any") === opt.value
                    ? "bg-yellow-500 text-stone-900"
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
            <div className="py-16 text-center text-sm text-stone-400">No hosts found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">Host</th>
                  <th className="px-4 py-3 text-left">Tier</th>
                  <th className="px-4 py-3 text-left">Trips</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map(({ profile, liveTrips, totalTrips, ratingAvg }) => (
                  <tr key={profile.id} className="hover:bg-stone-50/50">
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate font-medium text-ink">{profile.name}</p>
                      <p className="truncate text-xs text-stone-400">{profile.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_BADGE[profile.host_tier]}`}>
                        {profile.host_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      <span className="font-medium text-green-800">{liveTrips}</span>
                      <span className="text-stone-400"> / {totalTrips}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {ratingAvg > 0 ? (
                        <span className="font-medium">★ {ratingAvg.toFixed(1)}</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/users?q=${profile.email}`}
                          className="text-xs text-stone-500 hover:text-ink"
                        >
                          View
                        </Link>
                        {/* Tier selector */}
                        {profile.host_tier !== "superhost" && (
                          <form action={setTier}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <input type="hidden" name="tier" value="superhost" />
                            <button className="text-xs font-semibold text-yellow-500 hover:text-yellow-500">
                              → Superhost
                            </button>
                          </form>
                        )}
                        {profile.host_tier !== "flagged" && (
                          <form action={setTier}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <input type="hidden" name="tier" value="flagged" />
                            <button className="text-xs font-semibold text-red-600 hover:text-red-800">
                              Flag
                            </button>
                          </form>
                        )}
                        {profile.host_tier !== "standard" && (
                          <form action={setTier}>
                            <input type="hidden" name="userId" value={profile.id} />
                            <input type="hidden" name="tier" value="standard" />
                            <button className="text-xs font-semibold text-stone-500 hover:text-stone-700">
                              Reset
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
