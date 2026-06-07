import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getVerificationRequest,
  getSignedUrl,
  approveVerification,
  rejectVerification,
} from "@/actions/verification";
import { AdminChecklist } from "./AdminChecklist";

export const metadata = { title: "Review verification · Admin" };

const ID_LABEL: Record<string, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  passport: "Passport",
  driving_licence: "Driving Licence",
};

export default async function VerificationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const req = await getVerificationRequest(id);
  if (!req) notFound();

  const [idDocUrl, selfieUrl] = await Promise.all([
    getSignedUrl(req.id_doc_path),
    getSignedUrl(req.selfie_path),
  ]);

  async function handleApprove() {
    "use server";
    await approveVerification(id, req.user_id);
    redirect("/admin/verifications");
  }

  async function handleReject(formData: FormData) {
    "use server";
    const reason = String(formData.get("reason") ?? "").trim() || "Documents unclear or mismatched.";
    await rejectVerification(id, reason);
    redirect("/admin/verifications");
  }

  const isPending = req.status === "pending";
  const faceScore = req.face_match_score;
  const riskScore = req.risk_score ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/verifications" className="text-xs text-stone-400 hover:text-stone-600">
          ← All verifications
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {(req as any).profile?.name ?? "Unknown user"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {ID_LABEL[req.id_type]} · Submitted{" "}
            {new Date(req.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
            {req.status !== "pending" && ` · ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}`}
          </p>
        </div>

        {/* Risk indicator */}
        <div className={`shrink-0 rounded-xl px-3 py-1.5 text-center text-xs font-semibold ${
          riskScore <= 30
            ? "bg-green-50 text-green-700 ring-1 ring-green-200"
            : riskScore <= 70
              ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
        }`}>
          <div className="text-[10px] font-normal uppercase tracking-wider opacity-70">Risk</div>
          <div className="text-lg font-bold">{riskScore}</div>
          <div>{riskScore <= 30 ? "Low" : riskScore <= 70 ? "Medium" : "High"}</div>
        </div>
      </div>

      {/* Document images */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            ID Document — {ID_LABEL[req.id_type]}
          </div>
          {idDocUrl ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <img
                src={idDocUrl}
                alt="ID document"
                className="h-full w-full object-contain"
                style={{ maxHeight: 280 }}
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
              Image unavailable
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <span>Live Face Scan</span>
            {faceScore !== null && faceScore !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case ${
                faceScore >= 0.6
                  ? "bg-green-100 text-green-700"
                  : faceScore >= 0.4
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}>
                {faceScore >= 0.6 ? "✓ Faces match" : faceScore >= 0.4 ? "⚠ Partial match" : "✕ No match"}{" "}
                ({(faceScore * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          {selfieUrl ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <img
                src={selfieUrl}
                alt="Live face scan"
                className="h-full w-full object-contain"
                style={{ maxHeight: 280 }}
              />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm text-stone-400">
              Image unavailable
            </div>
          )}
        </div>
      </div>

      {/* Checklist + actions as a client component so checkboxes gate the approve button */}
      {isPending ? (
        <AdminChecklist
          onApprove={handleApprove}
          onReject={handleReject}
          faceScore={faceScore}
          riskScore={riskScore}
        />
      ) : (
        <div className={`rounded-2xl p-5 text-sm ring-1 ring-inset ${
          req.status === "approved"
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : "bg-red-50 text-red-800 ring-red-200"
        }`}>
          <strong>{req.status === "approved" ? "Approved" : "Rejected"}</strong>
          {req.admin_notes && <span> — {req.admin_notes}</span>}
          {req.reviewed_at && (
            <span className="ml-2 opacity-60">
              · {new Date(req.reviewed_at).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
