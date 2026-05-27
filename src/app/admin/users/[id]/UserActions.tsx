"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  setUserRole,
  toggleUserVerified,
  suspendUser,
  unsuspendUser,
  setUserPlus,
} from "../actions";
import type { UserRole } from "@/types/db";

export function UserActions({
  userId,
  currentRole,
  idVerified,
  isSuspended,
  isSelf,
  isPlus,
}: {
  userId: string;
  currentRole: UserRole;
  idVerified: boolean;
  isSuspended: boolean;
  isSelf: boolean;
  isPlus: boolean;
}) {
  return (
    <div className="space-y-3">
      <RoleCard userId={userId} currentRole={currentRole} isSelf={isSelf} />
      <VerificationCard userId={userId} idVerified={idVerified} />
      <PlusCard userId={userId} isPlus={isPlus} />
      <SuspensionCard
        userId={userId}
        isSuspended={isSuspended}
        isSelf={isSelf}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Role                                                                       */
/* -------------------------------------------------------------------------- */

function RoleCard({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  return (
    <Card title="Role">
      <p className="text-xs text-stone-500">
        Determines what the user can do across the platform.
      </p>
      <form action={setUserRole} className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="id" value={userId} />
        <select
          name="role"
          defaultValue={currentRole}
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="traveller">Traveller</option>
          <option value="host">Host</option>
          <option value="admin">Admin</option>
        </select>
        {isSelf && (
          <p className="text-xs text-indigo-700">
            This is your own account - you can&rsquo;t demote yourself.
          </p>
        )}
        <SubmitButton label="Save role" pendingLabel="Saving…" />
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* ID Verification                                                            */
/* -------------------------------------------------------------------------- */

function VerificationCard({
  userId,
  idVerified,
}: {
  userId: string;
  idVerified: boolean;
}) {
  return (
    <Card title="ID verification">
      <p className="text-xs text-stone-500">
        Required for hosting and high-value bookings.
      </p>
      <form action={toggleUserVerified} className="mt-3">
        <input type="hidden" name="id" value={userId} />
        <input
          type="hidden"
          name="verified"
          value={idVerified ? "0" : "1"}
        />
        <SubmitButton
          label={idVerified ? "Remove verification" : "Mark as verified"}
          pendingLabel="Saving…"
          variant={idVerified ? "neutral" : "primary"}
        />
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Plus membership                                                            */
/* -------------------------------------------------------------------------- */

function PlusCard({ userId, isPlus }: { userId: string; isPlus: boolean }) {
  return (
    <Card title="Packuptrip Plus">
      <p className="text-xs text-stone-500">
        Plus members pay a 4% service fee and earn double referral credits.
      </p>
      <form action={setUserPlus} className="mt-3">
        <input type="hidden" name="id" value={userId} />
        <input type="hidden" name="plus" value={isPlus ? "0" : "1"} />
        <SubmitButton
          label={isPlus ? "Revoke Plus" : "Grant Plus (1 year)"}
          pendingLabel="Saving…"
          variant={isPlus ? "neutral" : "primary"}
        />
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Suspension                                                                 */
/* -------------------------------------------------------------------------- */

function SuspensionCard({
  userId,
  isSuspended,
  isSelf,
}: {
  userId: string;
  isSuspended: boolean;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (isSelf) {
    return (
      <Card title="Suspension">
        <p className="text-xs text-stone-500">
          You can&rsquo;t suspend your own admin account.
        </p>
      </Card>
    );
  }

  if (isSuspended) {
    return (
      <Card title="Suspension">
        <p className="text-xs text-stone-500">
          User is currently blocked from signing in.
        </p>
        <form action={unsuspendUser} className="mt-3">
          <input type="hidden" name="id" value={userId} />
          <SubmitButton
            label="Lift suspension"
            pendingLabel="Restoring…"
            variant="primary"
          />
        </form>
      </Card>
    );
  }

  return (
    <Card title="Suspension">
      <p className="text-xs text-stone-500">
        Blocks the user from signing in. Reason is recorded on their profile.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Suspend user…
        </button>
      ) : (
        <form action={suspendUser} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={userId} />
          <textarea
            name="reason"
            required
            minLength={4}
            rows={3}
            placeholder="Reason (e.g. repeated no-shows, fraud, breach of safety policy)"
            className="block w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <div className="flex gap-2">
            <SubmitButton
              label="Suspend"
              pendingLabel="Suspending…"
              variant="danger"
              className="flex-1"
              fullWidth={false}
            />
            <CancelButton onClick={() => setOpen(false)} />
          </div>
        </form>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  variant = "dark",
  className = "",
  fullWidth = true,
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "danger" | "dark" | "neutral";
  className?: string;
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();
  const variantCls = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    dark: "bg-stone-900 hover:bg-stone-800 text-white",
    neutral:
      "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={[
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70",
        fullWidth ? "w-full" : "",
        variantCls,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
    >
      Cancel
    </button>
  );
}
