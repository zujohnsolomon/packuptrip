import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getMyVerificationRequest } from "@/actions/verification";
import { VerifyClient } from "./VerifyClient";

export const metadata = { title: "Verify your identity · Packuptrip" };

const STATUS_COPY = {
  pending: {
    eyebrow: "Under review",
    title: "Your documents are being reviewed",
    body: "Our trust team will verify your documents within 1–2 business days. You'll see the verified badge on your profile once approved.",
    color: "bg-amber-50 ring-amber-200 text-amber-900",
  },
  approved: {
    eyebrow: "Verified ✓",
    title: "Your identity is verified",
    body: "Your profile now shows an ID Verified badge. Thank you for helping make Packuptrip a safer place to travel.",
    color: "bg-emerald-50 ring-emerald-200 text-emerald-900",
  },
  rejected: null, // handled inline — allows resubmit
};

export default async function VerifyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/verify");

  const existing = await getMyVerificationRequest();

  // Pending or approved — show status card, no form
  if (existing && existing.status !== "rejected") {
    const cfg = STATUS_COPY[existing.status];
    if (!cfg) redirect("/account/verify");

    return (
      <>
        <Header />
        <main className="flex-1 bg-white pt-20">
          <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
            <div className={`rounded-2xl p-8 ring-1 ring-inset text-center ${cfg.color}`}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
                {cfg.eyebrow}
              </div>
              <h1 className="mt-2 text-2xl font-semibold">{cfg.title}</h1>
              <p className="mt-3 text-sm leading-relaxed opacity-80">{cfg.body}</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // No request, or rejected → show form (with rejection reason if applicable)
  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div className="mb-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-green-800">
              Identity verification
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Verify your identity
            </h1>
            <p className="mt-2 text-stone-500">
              Upload a government ID and a quick selfie. Takes 2 minutes — earns trust that lasts.
            </p>
          </div>

          {existing?.status === "rejected" && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-inset ring-red-200">
              <strong>Previous submission rejected:</strong>{" "}
              {existing.admin_notes ?? "Please resubmit with clearer photos."}
            </div>
          )}

          <VerifyClient userId={user.id} />

          {/* Privacy notice */}
          <p className="mt-6 text-center text-xs text-stone-400">
            🔒 Your documents are encrypted and only visible to our trust team.
            They are never sold or shared with third parties.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
