import Link from "next/link";
import { listVerificationRequests } from "@/actions/verification";

export const metadata = { title: "Verifications · Admin" };

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  rejected: "bg-red-100 text-red-800 ring-red-200",
};

const ID_LABEL: Record<string, string> = {
  aadhaar: "Aadhaar",
  pan: "PAN Card",
  passport: "Passport",
  driving_licence: "Driving Licence",
};

export default async function AdminVerificationsPage() {
  const requests = await listVerificationRequests();
  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">ID Verifications</h1>
          <p className="mt-1 text-sm text-stone-500">
            {pendingCount > 0
              ? `${pendingCount} pending review`
              : "All caught up"}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 p-12 text-center text-stone-400">
          No verification requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">ID type</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-stone-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-ink">{req.profile?.name ?? "—"}</div>
                    <div className="text-xs text-stone-400">{req.profile?.email}</div>
                  </td>
                  <td className="px-5 py-4 text-stone-600">
                    {ID_LABEL[req.id_type] ?? req.id_type}
                  </td>
                  <td className="px-5 py-4 text-stone-500">
                    {new Date(req.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_CHIP[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/verifications/${req.id}`}
                      className="text-xs font-medium text-yellow-700 hover:underline"
                    >
                      {req.status === "pending" ? "Review →" : "View →"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
