"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Unified OAuth callback handler.
 *
 * Strategy:
 *   1. Create the Supabase browser client - its built-in
 *      `detectSessionInUrl` starts processing the URL fragment immediately
 *      (eats the `#access_token=…` and calls setSession internally).
 *   2. POLL `getSession()` every 200ms for up to 5 s. As soon as a session
 *      appears, hard-navigate to `?next=` so cookies are picked up by SSR.
 *   3. If polling expires, fall through to MANUAL handling:
 *        - `?code=…`               → `exchangeCodeForSession`
 *        - `#access_token=…&…`     → `setSession` directly
 *        - `#error=…`              → bubble the provider error message
 *   4. If all of that fails, bounce to /login with the error.
 *
 * Hard nav (`window.location.assign`) instead of `router.replace` so the
 * destination page sees the freshly-set session cookie on first paint.
 */

export const dynamic = "force-dynamic";

export default function AuthCallback() {
  return (
    <Suspense fallback={<Pending detail="Connecting…" />}>
      <CallbackInner />
    </Suspense>
  );
}

const POLL_INTERVAL_MS = 200;
const POLL_MAX_ATTEMPTS = 25; // 5 seconds

function CallbackInner() {
  const searchParams = useSearchParams();
  const [detail, setDetail] = useState<string>("Connecting…");
  const [failure, setFailure] = useState<string | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    const next = safeNext(searchParams.get("next"));
    const ref = searchParams.get("ref") ?? null;

    async function navigateTo(target: string) {
      if (finishedRef.current) return;
      finishedRef.current = true;

      // Attach referral code for OAuth sign-ups (email sign-ups handle this
      // via raw_user_meta_data at account creation time).
      if (ref) {
        try {
          await fetch(
            `/api/referral/attach?code=${encodeURIComponent(ref)}`,
            { method: "POST" },
          );
        } catch {
          // Non-fatal — don't block navigation on a failed referral attach.
        }
      }

      try {
        // Strip fragment + sensitive query before navigating.
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        /* ignore */
      }
      // Hard nav so the destination's SSR sees the fresh cookies.
      window.location.assign(target);
    }

    function bail(reason: string) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setFailure(reason);
      // Give the user a beat to see the message, then bounce.
      setTimeout(() => {
        window.location.assign(
          `/login?error=${encodeURIComponent("callback_failed")}`,
        );
      }, 1200);
    }

    let cancelled = false;
    let attempt = 0;

    async function pollOnce(): Promise<boolean> {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return true;
      if (data.session) {
        setDetail("Almost there…");
        await navigateTo(next);
        return true;
      }
      return false;
    }

    async function manualFallback() {
      const code = searchParams.get("code");
      if (code) {
        setDetail("Exchanging confirmation code…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          await navigateTo(next);
          return;
        }
        bail(error.message);
        return;
      }

      const rawHash = window.location.hash || "";
      const hash = rawHash.startsWith("#") ? rawHash.slice(1) : rawHash;
      const hashParams = new URLSearchParams(hash);
      const at = hashParams.get("access_token");
      const rt = hashParams.get("refresh_token");
      const errCode = hashParams.get("error");
      const errDesc = hashParams.get("error_description");

      if (errCode) {
        bail(errDesc || errCode);
        return;
      }
      if (at && rt) {
        setDetail("Saving your session…");
        const { error } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        });
        if (!error) {
          await navigateTo(next);
          return;
        }
        bail(error.message);
        return;
      }

      bail("No session in callback URL.");
    }

    async function loop() {
      // First, just in case the SDK already finished on init.
      if (await pollOnce()) return;
      setDetail("Completing sign-in…");

      const id = setInterval(async () => {
        if (cancelled) return;
        attempt++;
        if (await pollOnce()) {
          clearInterval(id);
          return;
        }
        if (attempt >= POLL_MAX_ATTEMPTS) {
          clearInterval(id);
          await manualFallback();
        }
      }, POLL_INTERVAL_MS);
    }

    loop().catch((e) =>
      bail(e instanceof Error ? e.message : "Unknown error"),
    );

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return failure ? <Failed message={failure} /> : <Pending detail={detail} />;
}

function safeNext(raw: string | null): string {
  if (!raw) return "/account";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/account";
}

function Pending({ detail }: { detail: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-9 w-9 animate-spin text-amber-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" className="opacity-20" />
            <polygon
              points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
              className="fill-amber-600/20 stroke-amber-600"
            />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">{detail}</div>
          <p className="mt-1 text-xs text-stone-500">
            One second while we finish setting up your session.
          </p>
        </div>
      </div>
    </main>
  );
}

function Failed({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-4">
      <div className="max-w-sm text-center">
        <div className="text-sm font-semibold text-red-700">Sign-in failed</div>
        <p className="mt-1 text-xs text-stone-500">{message}</p>
        <p className="mt-2 text-xs text-stone-500">
          Sending you back to the login page…
        </p>
      </div>
    </main>
  );
}
