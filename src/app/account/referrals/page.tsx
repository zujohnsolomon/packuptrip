import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/supabase/queries";

export const metadata = { title: "Referrals · Packuptrip" };

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/referrals");

  const stats = await getReferralStats(user.id);
  if (!stats) redirect("/account");

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://packuptrip.com"}/invite/${stats.referralCode}`;
  const totalReferrals = stats.pendingCount + stats.creditedCount;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

          {/* Header */}
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-ink mb-6"
          >
            ← Back to account
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Refer &amp; earn
          </h1>
          <p className="mt-1 text-stone-500 text-sm">
            Share your invite link. When your friend makes their first booking, you both benefit — they get ₹200 off, you earn ₹200 credit.
          </p>

          {/* Credit balance hero */}
          <div className="mt-7 rounded-3xl bg-gradient-to-br from-green-700 to-green-900 p-7 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-green-200">
              Your credit balance
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              ₹{stats.creditBalance.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-green-200">
              Applied automatically on your next booking at checkout.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="mt-0.5 text-xs text-green-200">Friends invited</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-2xl font-bold">{stats.creditedCount}</p>
                <p className="mt-0.5 text-xs text-green-200">Bookings completed</p>
              </div>
            </div>
          </div>

          {/* Invite link */}
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Your invite link
            </p>
            <InviteCopyBox url={inviteUrl} />
          </div>

          {/* How it works */}
          <div className="mt-8 rounded-2xl border border-stone-100 bg-stone-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-4">
              How it works
            </p>
            <ol className="space-y-4">
              {[
                {
                  icon: "🔗",
                  title: "Share your link",
                  body: "Send your unique invite link to friends who love travelling.",
                },
                {
                  icon: "✅",
                  title: "Friend signs up",
                  body: "They create a free account using your link. No credit card needed.",
                },
                {
                  icon: "🎒",
                  title: "Friend books their first trip",
                  body: "As soon as they confirm their first booking, you earn ₹200.",
                },
                {
                  icon: "💰",
                  title: "You both save",
                  body: "Your credit auto-applies at checkout. No codes, no fuss.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-200 text-base">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    <p className="text-xs text-stone-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Pending status */}
          {stats.pendingCount > 0 && (
            <div className="mt-6 rounded-2xl bg-indigo-50 px-5 py-4 ring-1 ring-inset ring-indigo-200 text-sm text-indigo-800">
              <strong>{stats.pendingCount} friend{stats.pendingCount !== 1 ? "s" : ""} signed up</strong> but {stats.pendingCount !== 1 ? "haven't" : "hasn't"} made a first booking yet.
              Your ₹{200 * stats.pendingCount} credit is pending and will unlock once they book.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Client island for clipboard copy */
import { InviteCopyBox } from "./InviteCopyBox";
