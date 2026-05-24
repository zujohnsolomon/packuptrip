import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Report sent · Packuptrip",
  robots: { index: false, follow: false },
};

export default function ReportSentPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckIcon />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
              Report received
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              Thanks for telling us. The Packuptrip team reviews every
              report. We&rsquo;ll reach out if we need more detail - your
              name is never shared with the person you reported.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/account"
                className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Your account
              </Link>
              <Link
                href="/"
                className="inline-flex h-10 items-center rounded-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
