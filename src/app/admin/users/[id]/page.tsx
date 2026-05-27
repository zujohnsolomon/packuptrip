import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getUserDetailForAdmin } from "@/lib/supabase/queries";
import { formatINR } from "@/lib/utils";
import { formatHumanDate } from "@/components/booking/BookingSummary";
import { UserActions } from "./UserActions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "User · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    role?: string;
    verified?: string;
    suspended?: string;
    plus?: string;
  }>;
}) {
  const [{ id }, sp, res] = await Promise.all([
    params,
    searchParams,
    (async () => {
      const { id } = await params;
      return getUserDetailForAdmin(id);
    })(),
  ]);
  if (!res) notFound();

  const { profile, bookings, hostedTrips } = res;
  const isSuspended = Boolean(profile.suspension_reason);

  // Who's logged in? Used to disable "demote self" + "suspend self".
  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isSelf = viewer?.id === profile.id;

  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "refunded")
    .reduce((s, b) => s + b.total, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · User"
        title={profile.name}
        description={profile.email}
        actions={
          <Link
            href="/admin/users"
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to users
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
        <FlashBanner sp={sp} />

        {isSuspended && (
          <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-100">
            <strong className="font-semibold">Suspended.</strong>{" "}
            {profile.suspension_reason}
            {profile.suspended_at && (
              <span className="text-red-600">
                {" "}
                ·{" "}
                {formatDistanceToNow(new Date(profile.suspended_at), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {/* Profile block */}
            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-5">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-amber-100 text-xl font-semibold text-amber-800">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">
                      {profile.name}
                    </h2>
                    <RoleChip role={profile.role} />
                    {profile.id_verified ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                        ID verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700 ring-1 ring-inset ring-stone-200">
                        Not verified
                      </span>
                    )}
                    {(profile as { plus_member?: boolean }).plus_member && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900 ring-1 ring-inset ring-green-200">
                        ✦ Plus
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-stone-600">
                    {profile.email}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                    <Stat
                      label="Joined"
                      value={formatDistanceToNow(new Date(profile.created_at), {
                        addSuffix: true,
                      })}
                    />
                    <Stat label="Bookings" value={String(bookings.length)} />
                    <Stat
                      label="Hosted trips"
                      value={String(hostedTrips.length)}
                    />
                  </dl>
                  {profile.bio && (
                    <p className="mt-4 text-sm text-stone-700 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Bookings */}
            <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="flex items-baseline justify-between border-b border-stone-100 px-6 py-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Bookings as traveller
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-ink">
                    {bookings.length === 0
                      ? "Nothing booked yet"
                      : `${bookings.length} booking${bookings.length === 1 ? "" : "s"}`}
                  </h3>
                </div>
                <div className="text-sm">
                  <span className="text-stone-500">Lifetime spend: </span>
                  <span className="font-semibold text-ink">
                    {formatINR(totalRevenue)}
                  </span>
                </div>
              </div>
              {bookings.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-500">
                  This user hasn&rsquo;t booked anything yet.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {bookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {b.itemTitle ?? "Unknown trip"}
                        </div>
                        <div className="text-xs text-stone-500">
                          {formatDistanceToNow(new Date(b.created_at), {
                            addSuffix: true,
                          })}{" "}
                          · {b.item_type}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <BookingStatusChip status={b.status} />
                        <span className="font-medium text-ink tabular-nums">
                          {formatINR(b.total)}
                        </span>
                        <Link
                          href={`/bookings/${b.id}`}
                          target="_blank"
                          className="text-stone-400 hover:text-ink"
                        >
                          →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Hosted trips */}
            <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="border-b border-stone-100 px-6 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Hosted trips
                </div>
                <h3 className="mt-1 text-base font-semibold text-ink">
                  {hostedTrips.length === 0
                    ? "Not hosted anything"
                    : `${hostedTrips.length} hosted trip${hostedTrips.length === 1 ? "" : "s"}`}
                </h3>
              </div>
              {hostedTrips.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-500">
                  This user hasn&rsquo;t hosted a trip yet.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {hostedTrips.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {t.title}
                        </div>
                        <div className="text-xs text-stone-500">
                          {t.location} · {formatHumanDate(t.start_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <TripStatusChip status={t.status} />
                        <Link
                          href={
                            t.status === "pending"
                              ? `/admin/approvals/${t.id}`
                              : `/trips/${t.id}`
                          }
                          target={t.status === "pending" ? undefined : "_blank"}
                          className="text-stone-400 hover:text-ink"
                        >
                          →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Actions sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <UserActions
              userId={profile.id}
              currentRole={profile.role}
              idVerified={profile.id_verified}
              isSuspended={isSuspended}
              isSelf={isSelf}
              isPlus={(profile as { plus_member?: boolean }).plus_member === true}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

function RoleChip({ role }: { role: "traveller" | "host" | "admin" }) {
  const styles = {
    traveller: "bg-stone-100 text-stone-700 ring-stone-200",
    host: "bg-green-100 text-green-900 ring-green-200",
    admin: "bg-amber-100 text-amber-800 ring-amber-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function BookingStatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-200 text-stone-700 ring-stone-300",
    refunded: "bg-stone-200 text-stone-700 ring-stone-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
        styles[status] ?? styles.requested
      }`}
    >
      {status}
    </span>
  );
}

function TripStatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-stone-100 text-stone-700 ring-stone-200",
    pending: "bg-amber-100 text-amber-800 ring-amber-200",
    live: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    completed: "bg-stone-200 text-stone-700 ring-stone-300",
    cancelled: "bg-red-100 text-red-800 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}

function FlashBanner({
  sp,
}: {
  sp: { role?: string; verified?: string; suspended?: string; plus?: string };
}) {
  if (sp.role) {
    return (
      <Banner variant="success">
        Role updated to <strong className="font-semibold">{sp.role}</strong>.
      </Banner>
    );
  }
  if (sp.verified === "1") {
    return <Banner variant="success">Marked as ID verified.</Banner>;
  }
  if (sp.verified === "0") {
    return <Banner variant="info">ID verification removed.</Banner>;
  }
  if (sp.suspended === "1") {
    return <Banner variant="warning">User suspended.</Banner>;
  }
  if (sp.suspended === "0") {
    return <Banner variant="success">User unsuspended.</Banner>;
  }
  if (sp.plus === "1") {
    return <Banner variant="success">✦ Plus membership granted (1 year).</Banner>;
  }
  if (sp.plus === "0") {
    return <Banner variant="info">Plus membership revoked.</Banner>;
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
    warning: "bg-amber-50 text-amber-800 ring-amber-100",
  }[variant];
  return (
    <div className={`mb-5 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${cls}`}>
      {children}
    </div>
  );
}
