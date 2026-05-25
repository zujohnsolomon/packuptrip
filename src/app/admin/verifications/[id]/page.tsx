import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getVerificationRequest,
  getSignedUrl,
  approveVerification,
  rejectVerification,
} from "@/actions/verification";

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

  // Generate signed URLs for the two images
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/verifications" className="text-xs text-stone-400 hover:text-stone-600">
          ← All verifications
        </Link>
      </div>

      <div className="mb-8">
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

      {/* Document images */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
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
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Selfie with ID
          </div>
          {selfieUrl ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
              <img
                src={selfieUrl}
                alt="Selfie with ID"
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

      {/* Checklist */}
      <div className="mb-8 rounded-2xl bg-stone-50 p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Verification checklist
        </div>
        <ul className="space-y-2 text-sm text-stone-600">
          {[
            "ID document is clearly legible — no blur, glare, or cropping",
            "Face in selfie clearly matches the ID photo",
            "ID type matches what the user selected",
            "No signs of digital manipulation or editing",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-stone-300">□</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Approve */}
          <form action={handleApprove}>
            <button
              type="submit"
              className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              ✓ Approve — mark as verified
            </button>
          </form>

          {/* Reject */}
          <form action={handleReject} className="space-y-3">
            <textarea
              name="reason"
              rows={2}
              placeholder="Rejection reason (optional — a default message is used if blank)"
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <button
              type="submit"
              className="w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              ✕ Reject
            </button>
          </form>
        </div>
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
