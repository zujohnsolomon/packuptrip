import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { lookupReportSubject } from "@/lib/supabase/queries";
import type { SubjectType } from "@/types/db";
import { ReportForm } from "./ReportForm";

export const metadata = {
  title: "Report an issue · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = {
  type?: SubjectType;
  id?: string;
  booking?: string;
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // Auth gate first - we want the reporter on record.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = `/report?${new URLSearchParams(
      Object.entries(sp).filter(([, v]) => v) as [string, string][],
    ).toString()}`;
    redirect(`/login?redirectTo=${encodeURIComponent(next)}`);
  }

  // Subject is required - without it we don't know what they're reporting.
  if (!sp.type || !sp.id || !["user", "trip", "package"].includes(sp.type)) {
    return <MissingSubject />;
  }
  const subject = await lookupReportSubject(sp.type, sp.id);
  if (!subject) return <MissingSubject />;

  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
        <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-700">
            Trust &amp; safety
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Report an issue
          </h1>
          <p className="mt-2 max-w-xl text-stone-600">
            Tell us what happened. Reports go straight to the Packuptrip
            team and are reviewed within 24 hours. We don&rsquo;t share your
            identity with the person you&rsquo;re reporting.
          </p>

          <div className="mt-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
            <SubjectCard subject={subject} />
            <div className="mt-6">
              <ReportForm
                subjectType={subject.type}
                subjectId={subject.id}
                bookingId={sp.booking ?? ""}
              />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-500">
            If someone is in immediate danger, call local emergency services
            first, then file a report.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SubjectCard({
  subject,
}: {
  subject: { type: SubjectType; id: string; title: string | null };
}) {
  const label =
    subject.type === "user"
      ? "About this person"
      : subject.type === "trip"
        ? "About this community trip"
        : "About this package";
  return (
    <div className="rounded-xl bg-stone-50 p-4 ring-1 ring-inset ring-stone-200">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-ink">
        {subject.title ?? "(unknown)"}
      </div>
    </div>
  );
}

function MissingSubject() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-20">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="text-xl font-semibold text-ink">
              Nothing to report
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              We couldn&rsquo;t find what you&rsquo;re trying to report. Go
              back to the trip or booking page and use the report link there.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
