"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If "Confirm email" is enabled, no session is returned — user must check inbox.
    if (data.session) {
      router.push("/account");
      router.refresh();
    } else {
      setInfo("Check your inbox to confirm your email, then log in.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Your name">
        <input
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="Asha Mehta"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
          placeholder="At least 6 characters"
        />
      </Field>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-100">
          {info}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-xs leading-relaxed text-stone-500">
        By signing up you agree to our{" "}
        <a href="/terms" className="underline hover:text-stone-700">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-stone-700">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </span>
      {children}
    </label>
  );
}
