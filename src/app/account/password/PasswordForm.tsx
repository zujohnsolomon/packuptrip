"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export function PasswordForm() {
  const router = useRouter();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const strength = rules.filter((r) => r.test(newPw)).length;
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-teal-500"][strength];
  const canSubmit = strength === rules.length && newPw === confirmPw && newPw.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (newPw !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/account"), 2000);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-6 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 text-sm font-semibold text-teal-800">Password updated</p>
        <p className="mt-1 text-xs text-teal-600">Taking you back to your account…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">

        {/* New password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            New password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              placeholder="Enter new password"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Strength bar */}
          {newPw.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {rules.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < strength ? strengthColor : "bg-stone-200"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                  {rules.map((r) => (
                    <span
                      key={r.label}
                      className={`text-[11px] ${
                        r.test(newPw) ? "text-teal-600" : "text-stone-400"
                      }`}
                    >
                      {r.test(newPw) ? "✓" : "·"} {r.label}
                    </span>
                  ))}
                </div>
                <span className={`text-[11px] font-semibold ${
                  strength === 3 ? "text-teal-600" : strength === 2 ? "text-amber-600" : "text-red-500"
                }`}>
                  {strengthLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Confirm new password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat new password"
              className={`w-full rounded-xl border bg-stone-50 px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 ${
                confirmPw && newPw !== confirmPw
                  ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                  : confirmPw && newPw === confirmPw
                  ? "border-teal-300 focus:border-teal-300 focus:ring-teal-100"
                  : "border-stone-200 focus:border-amber-300 focus:ring-amber-100"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {confirmPw && newPw !== confirmPw && (
            <p className="mt-1 text-xs text-red-500">Passwords don&rsquo;t match</p>
          )}
          {confirmPw && newPw === confirmPw && (
            <p className="mt-1 text-xs text-teal-600">✓ Passwords match</p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <a
          href="/account"
          className="text-sm text-stone-500 hover:text-ink"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded-full bg-amber-500 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
