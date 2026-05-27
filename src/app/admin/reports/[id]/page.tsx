import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getReportForAdmin } from "@/lib/supabase/queries";
import type { ReportCategory, ReportStatus } from "@/types/db";
import { ReportActions } from "./ReportActions";

export const metadata = { title: "Report · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; notes?: string }>;
}) {
  const [{ id }, sp, res] = await Promise.all([
    params,
    searchParams,
    (async () => {
      const { id } = await params;
      return getReportForAdmin(id);
    })(),
  ]);
  if (!res) notFound();
  const {
    report,
    reporter,
    subject,
    subjectProfile,
    subjectTrip,
    subjectPackage,
    booking,
  } = res;

  return (
    <>
      <AdminPageHeader
        eyebrow={`Admin · ${report.category.toUpperCase()} report`}
        title={subject.title ?? "(unknown subject)"}
        description={`Filed ${formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}`}
        actions={
          <Link
            href="/admin/reports"
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to queue
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <FlashBanner sp={sp} />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryChip category={report.category} />
                <StatusChip status={report.status} />
                {report.resolved_at && (
                  <span className="text-xs text-stone-500">
                    Resolved{" "}
                    {formatDistanceToNow(new Date(report.resolved_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-base font-semibold text-ink">
                What was reported
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                {report.description}
              </p>
            </section>

            {/* Subject card - who/what was reported */}
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Subject
              </div>
              <SubjectBlock
                subjectType={subject.type}
                subjectProfile={subjectProfile}
                subjectTrip={subjectTrip}
                subjectPackage={subjectPackage}
              />
            </section>

            {/* Reporter card */}
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Reporter
              </div>
              {reporter ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-800">
                    {reporter.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      {reporter.name}
                    </div>
                    <div className="truncate text-xs text-stone-500">
                      {reporter.email}
                    </div>
                  </div>
                  <Link
                    href={`/admin/users/${reporter.id}`}
                    className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
                  >
                    View user →
                  </Link>
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-500">
                  Reporter account has been deleted.
                </p>
              )}
            </section>

            {booking && (
              <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Booking context
                </div>
                <p className="mt-2 text-sm text-stone-700">
                  This report was filed against a specific booking
                  (reference{" "}
                  <span className="font-mono">
                    {booking.id.slice(0, 8).toUpperCase()}
                  </span>
                  ).
                </p>
                <Link
                  href={`/admin/bookings/${booking.id}`}
                  className="mt-3 inline-flex h-9 items-center rounded-full bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  Open booking →
                </Link>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ReportActions
              reportId={report.id}
              status={report.status}
              currentNotes={report.admin_notes ?? ""}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function SubjectBlock({
  subjectType,
  subjectProfile,
  subjectTrip,
  subjectPackage,
}: {
  subjectType: string;
  subjectProfile: import("@/types/db").Profile | null;
  subjectTrip: import("@/types/db").Trip | null;
  subjectPackage: import("@/types/db").Package | null;
}) {
  if (subjectType === "user") {
    if (!subjectProfile) {
      return (
        <p className="mt-3 text-sm text-stone-500">
          Reported user has been deleted.
        </p>
      );
    }
    return (
      <div className="mt-3 flex items-center gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700">
          {subjectProfile.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">
            {subjectProfile.name}
          </div>
          <div className="truncate text-xs text-stone-500">
            {subjectProfile.email}
            {subjectProfile.suspension_reason && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                Suspended
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/admin/users/${subjectProfile.id}`}
          className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
        >
          Manage user →
        </Link>
      </div>
    );
  }
  if (subjectType === "trip") {
    if (!subjectTrip) {
      return (
        <p className="mt-3 text-sm text-stone-500">
          Reported trip no longer exists.
        </p>
      );
    }
    return (
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-ink">{subjectTrip.title}</div>
          <div className="text-xs text-stone-500">{subjectTrip.location}</div>
          <div className="mt-1 text-xs text-stone-500">
            status:{" "}
            <span className="font-medium text-stone-700">
              {subjectTrip.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 text-xs">
          {subjectTrip.status === "pending" ? (
            <Link
              href={`/admin/approvals/${subjectTrip.id}`}
              className="font-semibold text-yellow-700 hover:text-yellow-800"
            >
              Review trip →
            </Link>
          ) : (
            <Link
              href={`/trips/${subjectTrip.id}`}
              target="_blank"
              className="font-semibold text-yellow-700 hover:text-yellow-800"
            >
              View live →
            </Link>
          )}
          <Link
            href={`/admin/users/${subjectTrip.host_id}`}
            className="text-stone-600 hover:text-ink"
          >
            View host →
          </Link>
        </div>
      </div>
    );
  }
  if (subjectType === "package") {
    if (!subjectPackage) {
      return (
        <p className="mt-3 text-sm text-stone-500">
          Reported package no longer exists.
        </p>
      );
    }
    return (
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-semibold text-ink">{subjectPackage.title}</div>
          <div className="text-xs text-stone-500">
            {subjectPackage.location}
          </div>
        </div>
        <Link
          href={`/admin/originals/${subjectPackage.id}`}
          className="text-xs font-semibold text-yellow-700 hover:text-yellow-800"
        >
          Manage package →
        </Link>
      </div>
    );
  }
  return null;
}

function CategoryChip({ category }: { category: ReportCategory }) {
  const styles: Record<ReportCategory, string> = {
    safety: "bg-red-100 text-red-800 ring-red-200",
    harassment: "bg-red-100 text-red-800 ring-red-200",
    fraud: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    other: "bg-stone-100 text-stone-700 ring-stone-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[category]}`}
    >
      {category}
    </span>
  );
}

function StatusChip({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    open: "bg-red-100 text-red-800 ring-red-200",
    investigating: "bg-yellow-100 text-yellow-800 ring-yellow-200",
    resolved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { status?: string; notes?: string };
}) {
  if (sp.status === "investigating") {
    return (
      <Banner variant="info">
        Marked as investigating. Take it from here - add notes as you go.
      </Banner>
    );
  }
  if (sp.status === "resolved") {
    return <Banner variant="success">Report resolved.</Banner>;
  }
  if (sp.status === "open") {
    return <Banner variant="warning">Re-opened.</Banner>;
  }
  if (sp.notes) {
    return <Banner variant="info">Notes saved.</Banner>;
  }
  return null;
}

function Banner({
  variant,
  children,
}: {
  variant: "success" | "info" | "warning";
  children: React.ReactNode;
}) {
  const cls = {
    success: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    info: "bg-stone-50 text-stone-700 ring-stone-200",
    warning: "bg-yellow-50 text-yellow-800 ring-yellow-100",
  }[variant];
  return (
    <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${cls}`}>
      {children}
    </div>
  );
}
