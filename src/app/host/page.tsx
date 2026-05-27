import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import {
  HOST_COMMISSION_RATE,
  SERVICE_FEE_RATE,
} from "@/lib/pricing";

export const metadata = {
  title: "Host a trip · Packuptrip",
  description:
    "Got plans? Bring people along. Post your trip on Packuptrip, pick who joins, split costs fairly. We handle payments - you handle the memories.",
};

export const dynamic = "force-dynamic";

export default async function HostLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If they're signed in and already host trips, the dashboard is more
  // useful than the pitch. Show a "Your trips" pill at the top.
  let hasExistingTrips = false;
  if (user) {
    const { count } = await supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id);
    hasExistingTrips = (count ?? 0) > 0;
  }

  const startCta = user ? "/host/new" : "/login?redirectTo=/host/new";

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-green-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-[420px] w-[420px] rounded-full bg-yellow-200/30 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <Badge variant="community">For hosts</Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Planning a trip?
                <br />
                <span className="text-green-800">Bring people along.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-stone-600">
                Post your trip on Packuptrip, pick who joins, split costs
                fairly. We handle payments - you handle the memories.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={startCta}
                  className="inline-flex h-12 items-center rounded-full bg-green-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-green-800"
                >
                  Post a trip →
                </Link>
                {hasExistingTrips && (
                  <Link
                    href="/host/trips"
                    className="inline-flex h-12 items-center rounded-full border border-stone-200 bg-white px-6 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
                  >
                    Your trips
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-green-800">
                How hosting works
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Three steps to a full trip
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <Step
                n="1"
                title="Post your trip"
                body="Title, dates, where you're going, how much per share. Add a day-by-day if you've got one - joiners trust specifics."
              />
              <Step
                n="2"
                title="We review, then publish"
                body="Packuptrip checks every community trip within 24 hours. Once live, your trip shows up in browse and search."
              />
              <Step
                n="3"
                title="Travellers join, we collect"
                body="Joiners book through Packuptrip - payment is held by our partner until your trip starts, then released to you minus our commission."
              />
            </div>
          </div>
        </section>

        {/* Commission + fees */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-green-800">
                  What it costs
                </div>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
                  Simple, no hidden numbers
                </h2>
                <p className="mt-4 max-w-xl text-stone-700">
                  Packuptrip takes a small cut so we can keep the platform
                  safe, support travellers, and pay our team. Joiners see a
                  separate service fee on top of your price - that doesn&rsquo;t
                  come out of your share.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-stone-700">
                  <li>• Set your own per-share price.</li>
                  <li>
                    • Travellers pay a {Math.round(SERVICE_FEE_RATE * 100)}%
                    service fee on top - that&rsquo;s ours, not yours.
                  </li>
                  <li>
                    • We take {Math.round(HOST_COMMISSION_RATE * 100)}% of your
                    share as host commission when funds settle.
                  </li>
                  <li>
                    • Money is held by our payments partner until the trip
                    starts. No upfront risk for joiners means more bookings.
                  </li>
                </ul>
              </div>

              <ExampleCard />
            </div>
          </div>
        </section>

        {/* Expectations */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-green-800">
                What we expect from hosts
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Be the host you&rsquo;d want
              </h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
              <Expectation
                title="Be specific in your listing"
                body="Real itinerary, honest description, photos that match the trip. Vague listings get rejected."
              />
              <Expectation
                title="Reply within 24 hours"
                body="When someone applies to join, respond quickly. Quick replies = more joiners over time."
              />
              <Expectation
                title="Honour your bookings"
                body="No-shows and last-minute cancellations hurt joiners and your rating. Plan trips you'll actually run."
              />
              <Expectation
                title="Keep it safe and respectful"
                body="Any safety or harassment issue triggers a review. We have zero tolerance for either."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-green-800">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ready to find your group?
              </h2>
              <p className="mt-3 max-w-xl text-green-50/90">
                Posting takes about 10 minutes. You can save a draft and
                finish later if you&rsquo;re not ready.
              </p>
            </div>
            <Link
              href={startCta}
              className="inline-flex h-12 shrink-0 items-center rounded-full bg-white px-7 text-sm font-semibold text-green-900 shadow-lg transition hover:bg-stone-100"
            >
              Post your first trip →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-green-700 text-sm font-semibold text-white">
        {n}
      </div>
      <div className="mt-4 text-lg font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  );
}

function ExampleCard() {
  // Worked example so the numbers feel real.
  const share = 10000;
  const fee = Math.round(share * SERVICE_FEE_RATE);
  const total = share + fee;
  const commission = Math.round(share * HOST_COMMISSION_RATE);
  const youGet = share - commission;
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Worked example
      </div>
      <div className="mt-1 text-base font-semibold text-ink">
        For each joiner
      </div>
      <dl className="mt-4 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
        <Row
          label="Your per-share price"
          value={`₹${share.toLocaleString("en-IN")}`}
        />
        <Row
          label={`Service fee (${Math.round(SERVICE_FEE_RATE * 100)}%, paid by joiner)`}
          value={`+ ₹${fee.toLocaleString("en-IN")}`}
        />
        <div className="my-1 h-px bg-stone-200" />
        <Row
          label="Joiner pays"
          value={`₹${total.toLocaleString("en-IN")}`}
          bold
        />
      </dl>
      <dl className="mt-4 space-y-2 rounded-xl bg-green-50 p-4 text-sm ring-1 ring-inset ring-green-100">
        <Row
          label="Your gross"
          value={`₹${share.toLocaleString("en-IN")}`}
        />
        <Row
          label={`Packuptrip commission (${Math.round(HOST_COMMISSION_RATE * 100)}%)`}
          value={`− ₹${commission.toLocaleString("en-IN")}`}
        />
        <div className="my-1 h-px bg-green-200" />
        <Row
          label="You get"
          value={`₹${youGet.toLocaleString("en-IN")}`}
          bold
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold text-ink" : "text-stone-600"}>
        {label}
      </span>
      <span
        className={
          bold ? "font-semibold text-ink tabular-nums" : "text-stone-700 tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function Expectation({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <div className="font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
    </div>
  );
}
