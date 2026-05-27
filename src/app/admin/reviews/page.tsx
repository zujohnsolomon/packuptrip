import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  listReviewsForAdmin,
  adminSetReviewVisibility,
} from "@/lib/supabase/queries";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Reviews · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

const VISIBILITY_OPTIONS = [
  { value: "any",     label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden",  label: "Hidden" },
];

const RATING_STARS: Record<number, string> = {
  5: "text-indigo-500",
  4: "text-indigo-400",
  3: "text-stone-400",
  2: "text-orange-500",
  1: "text-red-500",
};

type SP = { q?: string; visible?: string };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const visible = (sp.visible ?? "any") as "any" | "visible" | "hidden";
  const rows = await listReviewsForAdmin({ q: sp.q, visible });

  const counts = {
    all:     rows.length,
    visible: rows.filter((r) => r.review.is_visible).length,
    hidden:  rows.filter((r) => !r.review.is_visible).length,
  };

  async function hideReview(formData: FormData) {
    "use server";
    const id = String(formData.get("reviewId"));
    await adminSetReviewVisibility(id, false);
    revalidatePath("/admin/reviews");
  }

  async function showReview(formData: FormData) {
    "use server";
    const id = String(formData.get("reviewId"));
    await adminSetReviewVisibility(id, true);
    revalidatePath("/admin/reviews");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Reviews"
        title="Reviews"
        description="All user reviews. Hide inappropriate content or restore hidden reviews."
        actions={
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
            {rows.length} reviews
          </span>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",   value: counts.all },
            { label: "Visible", value: counts.visible, color: "text-green-800" },
            { label: "Hidden",  value: counts.hidden,  color: "text-red-700" },
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
              placeholder="Search review text…"
              className="w-full max-w-xs rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {sp.visible && <input type="hidden" name="visible" value={sp.visible} />}
          </form>
          <div className="flex flex-wrap gap-1.5">
            {VISIBILITY_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={`/admin/reviews?visible=${opt.value}${sp.q ? `&q=${sp.q}` : ""}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  visible === opt.value
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
            <div className="py-16 text-center text-sm text-stone-400">No reviews found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Review</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map(({ review, author, subjectTitle }) => (
                  <tr key={review.id} className={`hover:bg-stone-50/50 ${!review.is_visible ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      {author ? (
                        <Link
                          href={`/admin/users?q=${author.id}`}
                          className="text-xs font-medium text-indigo-700 hover:underline"
                        >
                          {author.name}
                        </Link>
                      ) : (
                        <span className="text-xs text-stone-400">Deleted user</span>
                      )}
                    </td>
                    <td className="max-w-[160px] px-4 py-3">
                      <p className="truncate text-xs text-stone-600">{subjectTitle ?? "—"}</p>
                      <p className="text-[10px] uppercase tracking-wider text-stone-400">
                        {review.subject_type}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${RATING_STARS[review.rating] ?? "text-stone-400"}`}>
                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <p className="line-clamp-2 text-xs text-stone-600">
                        {review.text ?? <span className="italic text-stone-400">No text</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          review.is_visible
                            ? "bg-green-100 text-green-900"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {review.is_visible ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        {review.is_visible ? (
                          <form action={hideReview}>
                            <input type="hidden" name="reviewId" value={review.id} />
                            <button className="text-xs font-semibold text-red-600 hover:text-red-800">
                              Hide
                            </button>
                          </form>
                        ) : (
                          <form action={showReview}>
                            <input type="hidden" name="reviewId" value={review.id} />
                            <button className="text-xs font-semibold text-green-800 hover:text-green-950">
                              Restore
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
