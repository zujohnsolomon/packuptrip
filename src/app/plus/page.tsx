import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Packuptrip Plus · Travel more, pay less",
  description:
    "Packuptrip Plus members pay half the service fee, get a priority badge, and access exclusive trips. Join the waitlist.",
};

async function joinWaitlist(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const { createClient: create } = await import("@/lib/supabase/server");
  const supabase = await create();

  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("plus_waitlist").insert({
    email,
    user_id: user?.id ?? null,
  });

  redirect("/plus?joined=1");
}

export default async function PlusPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const sp = await searchParams;
  const joined = sp.joined === "1";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already Plus, show a "You're already Plus" screen
  let isPlus = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plus_member, plus_expires_at")
      .eq("id", user.id)
      .maybeSingle<{ plus_member: boolean; plus_expires_at: string | null }>();
    isPlus = profile?.plus_member === true;
  }

  const PERKS = [
    {
      icon: "💸",
      title: "Half the service fee",
      body: "Pay just 4% service fee instead of 8% on every booking. Savings add up fast.",
    },
    {
      icon: "⚡",
      title: "Priority join requests",
      body: "Your join requests go to the top of the host's queue — never miss a trip.",
    },
    {
      icon: "✦",
      title: "Plus badge on profile",
      body: "A tasteful badge signals to hosts you're a committed traveller.",
    },
    {
      icon: "🔒",
      title: "Plus-only exclusive trips",
      body: "Some hosts only open spots to Plus members. Access before anyone else.",
    },
    {
      icon: "🎁",
      title: "Double referral credits",
      body: "Earn ₹400 per referral instead of ₹200 when your friend books their first trip.",
    },
    {
      icon: "🛟",
      title: "Priority support",
      body: "Any issue with a booking? Plus members get a dedicated response within 4 hours.",
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-800 to-green-950 px-4 py-20 text-center sm:px-6">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 60% 40%, white 1px, transparent 1px)", backgroundSize: "48px 48px" }}
          />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-green-200 ring-1 ring-white/20">
              ✦ Packuptrip Plus — coming soon
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Travel more.<br className="hidden sm:block" /> Pay less.
            </h1>
            <p className="mt-4 text-lg text-green-100 max-w-xl mx-auto">
              A membership for people who take their trips seriously. Cut your service fee in half, unlock exclusive trips, and stand out to the best hosts.
            </p>

            <div className="mt-3 inline-flex items-baseline gap-1.5">
              <span className="text-5xl font-bold text-white">₹999</span>
              <span className="text-green-200 text-lg">/year</span>
            </div>
            <p className="text-green-300 text-sm">Less than ₹83 a month. Pays for itself in one trip.</p>
          </div>
        </section>

        {/* ── Already Plus ─────────────────────────────────────────── */}
        {isPlus && (
          <section className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
            <div className="rounded-3xl bg-green-50 p-8 ring-1 ring-inset ring-green-200">
              <div className="text-4xl">✦</div>
              <h2 className="mt-3 text-xl font-semibold text-ink">You're already a Plus member!</h2>
              <p className="mt-2 text-stone-500 text-sm">
                You're getting all the perks — reduced fee, priority queue, and the Plus badge on your profile.
              </p>
              <Link
                href="/trips"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Browse trips →
              </Link>
            </div>
          </section>
        )}

        {/* ── Waitlist success ─────────────────────────────────────── */}
        {!isPlus && joined && (
          <section className="mx-auto max-w-xl px-4 py-10 text-center sm:px-6">
            <div className="rounded-3xl bg-green-50 p-8 ring-1 ring-inset ring-green-200">
              <div className="text-4xl">🎉</div>
              <h2 className="mt-3 text-xl font-semibold text-ink">You're on the list!</h2>
              <p className="mt-2 text-stone-500 text-sm">
                We'll email you as soon as Plus launches. Founding members lock in the ₹999/year rate forever.
              </p>
            </div>
          </section>
        )}

        {/* ── Perks grid ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold text-ink">What you get</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm"
              >
                <div className="text-2xl">{perk.icon}</div>
                <p className="mt-3 font-semibold text-ink">{perk.title}</p>
                <p className="mt-1 text-sm text-stone-500">{perk.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Savings calculator ───────────────────────────────────── */}
        <section className="bg-stone-50 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-ink">The math is simple</h2>
            <p className="mt-2 text-stone-500 text-sm">
              If you book trips worth ₹25,000 in a year — at 8% service fee you'd pay ₹2,000. With Plus (4%) you pay ₹1,000. You've already covered the ₹999 membership.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Without Plus</p>
                <p className="mt-2 text-3xl font-bold text-stone-700">8%</p>
                <p className="mt-1 text-sm text-stone-400">service fee per booking</p>
              </div>
              <div className="rounded-2xl bg-green-800 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-200">With Plus</p>
                <p className="mt-2 text-3xl font-bold">4%</p>
                <p className="mt-1 text-sm text-green-200">half the service fee</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Waitlist CTA ─────────────────────────────────────────── */}
        {!isPlus && !joined && (
          <section className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
            <h2 className="text-xl font-semibold text-ink">
              Be a founding member
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Founding members lock in ₹999/year forever. Plus launches with our payments rollout — join the waitlist and we'll ping you first.
            </p>
            <form action={joinWaitlist} className="mt-6 flex gap-2">
              <input
                type="email"
                name="email"
                required
                defaultValue={user?.email ?? ""}
                placeholder="your@email.com"
                className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="submit"
                className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Join waitlist
              </button>
            </form>
            <p className="mt-3 text-xs text-stone-400">No spam. One email when Plus launches.</p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
