import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Payments & payouts · Packuptrip" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/payments");

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <Link
            href="/account"
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← Account
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Payments &amp; payouts
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage how you pay for trips and receive money as a host.
          </p>

          <div className="mt-8 space-y-4">
            {/* Coming soon card */}
            <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-400"
                    aria-hidden
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-500">
                    Online payments coming soon
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-yellow-500">
                    We&rsquo;re integrating Razorpay so you can pay for trips
                    securely and hosts can receive payouts directly to their
                    bank account. It&rsquo;ll be ready soon.
                  </p>
                </div>
              </div>
            </div>

            {/* What's coming */}
            <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
                What to expect
              </h2>
              <ul className="space-y-3">
                {[
                  {
                    icon: "💳",
                    title: "Secure card payments",
                    desc: "Pay with any UPI, card, or net banking via Razorpay.",
                  },
                  {
                    icon: "🏦",
                    title: "Host payouts",
                    desc: "Link your bank account and receive money when your trip fills up.",
                  },
                  {
                    icon: "🔒",
                    title: "Escrow protection",
                    desc: "Your money is held safely and only released after the trip begins.",
                  },
                  {
                    icon: "↩️",
                    title: "Refund policy",
                    desc: "Cancel 7+ days before and get a full refund, no questions asked.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="text-lg leading-snug">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {item.title}
                      </p>
                      <p className="text-xs text-stone-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Read refund policy */}
            <p className="text-center text-xs text-stone-400">
              Read our{" "}
              <Link
                href="/refunds"
                className="font-medium text-stone-600 underline-offset-2 hover:underline"
              >
                refund policy
              </Link>{" "}
              ·{" "}
              <Link
                href="/contact"
                className="font-medium text-stone-600 underline-offset-2 hover:underline"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
