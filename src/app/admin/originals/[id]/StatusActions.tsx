"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { setPackageStatus, deletePackage, togglePackageFeatured } from "../actions";
import type { PackageStatus } from "@/types/db";

export function StatusActions({
  id,
  status,
  featured,
  hasBookings,
}: {
  id: string;
  status: PackageStatus;
  featured: boolean;
  hasBookings: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        Status
      </div>
      <div className="mt-2 text-sm">
        Current: <CurrentStatus status={status} />
      </div>

      <div className="mt-4 grid gap-2">
        {status !== "live" && (
          <StatusForm id={id} to="live" variant="primary">
            Publish (set status to Live)
          </StatusForm>
        )}
        {status === "live" && (
          <StatusForm id={id} to="draft" variant="neutral">
            Unpublish (back to Draft)
          </StatusForm>
        )}
        {status !== "archived" && (
          <StatusForm id={id} to="archived" variant="neutral">
            Archive
          </StatusForm>
        )}
        {status === "archived" && (
          <StatusForm id={id} to="draft" variant="neutral">
            Restore to Draft
          </StatusForm>
        )}
      </div>

      {/* ── Feature on homepage ── */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Homepage hero
        </div>
        <form action={togglePackageFeatured}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="featured" value={featured ? "false" : "true"} />
          <FeaturedSubmit featured={featured} />
        </form>
        {featured && (
          <p className="mt-1.5 text-[11px] text-stone-400">
            This package appears in the homepage hero strip.
          </p>
        )}
      </div>

      <div className="mt-4 border-t border-stone-100 pt-4">
        <DeleteAction id={id} hasBookings={hasBookings} />
      </div>
    </div>
  );
}

function StatusForm({
  id,
  to,
  variant,
  children,
}: {
  id: string;
  to: PackageStatus;
  variant: "primary" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <form action={setPackageStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={to} />
      <StatusSubmit variant={variant}>{children}</StatusSubmit>
    </form>
  );
}

function StatusSubmit({
  variant,
  children,
}: {
  variant: "primary" | "neutral";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${cls}`}
    >
      {pending ? "Updating…" : children}
    </button>
  );
}

function DeleteAction({
  id,
  hasBookings,
}: {
  id: string;
  hasBookings: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (hasBookings) {
    return (
      <div className="text-xs text-stone-500">
        Can&rsquo;t delete - this package has bookings.{" "}
        <span className="text-stone-700">Archive it instead.</span>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Delete package
      </button>
    );
  }

  return (
    <form action={deletePackage} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <p className="text-xs text-stone-600">
        This permanently removes the package. There are no bookings to worry
        about. Continue?
      </p>
      <div className="flex gap-2">
        <DeleteSubmit />
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-red-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Deleting…" : "Yes, delete"}
    </button>
  );
}

function FeaturedSubmit({ featured }: { featured: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
        featured
          ? "border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {pending ? "Updating…" : featured ? "★ Featured — click to unfeature" : "☆ Feature on homepage"}
    </button>
  );
}

function CurrentStatus({ status }: { status: PackageStatus }) {
  const cls =
    status === "live"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : status === "draft"
        ? "bg-yellow-100 text-yellow-800 ring-yellow-200"
        : "bg-stone-200 text-stone-700 ring-stone-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}
