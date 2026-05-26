"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const refCode  = searchParams.get("ref") ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError === "callback_failed"
      ? "Google sign-up failed. Please try again."
      : urlError
  );
  const [info, setInfo] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  function onGoogleSignup() {
    setError(null);
    setInfo(null);
    setGoogleLoading(true);

    const redirectTo = safeRedirect(searchParams.get("redirectTo"));
    // Pass ref code through so the callback page can attach it to the profile
    const refParam = refCode ? `&ref=${encodeURIComponent(refCode)}` : "";
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}${refParam}`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setEmailLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    
    const redirectParam = safeRedirect(searchParams.get("redirectTo"));
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectParam)}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ref_code stored in raw_user_meta_data — read by handle_new_user trigger
        data: { name, ...(refCode ? { ref_code: refCode } : {}) },
        emailRedirectTo: callbackUrl,
      },
    });
    setEmailLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push(redirectParam);
      router.refresh();
    } else {
      setInfo("Check your inbox to confirm your email, then log in.");
    }
  }

  function handleComingSoon(provider: string) {
    setMessage(`${provider} is coming soon! Please use Google or Email.`);
    setTimeout(() => setMessage(null), 3500);
  }

  const loading = emailLoading || googleLoading;

  return (
    <div className="space-y-5 relative">
      {/* Referral credit banner */}
      {refCode && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-3.5 py-2.5">
          <span className="text-base">🎁</span>
          <p className="text-[11px] font-semibold text-teal-800">
            You were invited — ₹200 credit added on your first booking.
          </p>
        </div>
      )}
      {/* ── Rotating Compass Redirect Overlay ── */}
      {googleLoading && (
        <div className="absolute inset-x-0 -top-6 -bottom-6 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-tag-reveal rounded-[2rem]">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <div className="h-9 w-9 text-amber-600 animate-spin flex items-center justify-center">
              <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" className="opacity-20" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" className="stroke-amber-600 fill-amber-600/20" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-stone-850 font-sans">
                Connecting to Google
              </p>
              <p className="text-[9px] text-stone-400 font-sans mt-0.5 tracking-wide">
                Redirecting to secure verification...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Circular Branded Social Capsule (Facebook, Apple, Google) ── */}
      <div className="flex items-center justify-center gap-4 py-1">
        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleComingSoon("Facebook")}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm hover:scale-108 hover:border-blue-500/20 active:scale-95 transition-all focus:outline-none disabled:opacity-50"
          title="Sign up with Facebook"
        >
          <svg className="h-5.5 w-5.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleComingSoon("Apple")}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm hover:scale-108 hover:border-stone-900/20 active:scale-95 transition-all focus:outline-none disabled:opacity-50"
          title="Sign up with Apple"
        >
          <svg className="h-5 w-5 text-stone-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
          </svg>
        </button>

        {/* Google (FULLY FUNCTIONAL!) */}
        <button
          type="button"
          onClick={onGoogleSignup}
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm hover:scale-108 hover:border-amber-500/20 active:scale-95 transition-all focus:outline-none"
          title="Continue with Google"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        </button>
      </div>

      {message && (
        <div className="rounded-2xl bg-stone-900 text-stone-100 text-[10px] px-3.5 py-1.5 text-center border border-stone-800 animate-tag-reveal max-w-[250px] mx-auto shadow-md">
          {message}
        </div>
      )}

      {/* ── Classic Divider ── */}
      <div className="relative flex items-center justify-center py-1.5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200/60"></div>
        </div>
        <span className="relative bg-white px-4 text-xs font-semibold text-stone-400 font-sans">
          or
        </span>
      </div>

      {/* ── Inputs with Overlapping Border-Label style ── */}
      <form onSubmit={onSubmit} className="space-y-5">
        
        {/* Full Name Field */}
        <div className="relative rounded-xl border border-stone-300 bg-white focus-within:border-stone-800 focus-within:ring-1 focus-within:ring-stone-800/20 transition-all duration-300">
          <label className="absolute -top-2 left-4 bg-white px-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider font-sans leading-none pointer-events-none select-none">
            Username
          </label>
          <input
            type="text"
            autoComplete="name"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full border-0 bg-transparent px-4 py-3 text-xs text-stone-900 placeholder-transparent focus:ring-0 focus:outline-none disabled:opacity-50 font-sans"
            placeholder="Robert Fox"
          />
        </div>

        {/* Email Field */}
        <div className="relative rounded-xl border border-stone-300 bg-white focus-within:border-stone-800 focus-within:ring-1 focus-within:ring-stone-800/20 transition-all duration-300">
          <label className="absolute -top-2 left-4 bg-white px-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider font-sans leading-none pointer-events-none select-none">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full border-0 bg-transparent px-4 py-3 text-xs text-stone-900 placeholder-transparent focus:ring-0 focus:outline-none disabled:opacity-50 font-sans"
            placeholder="robert.fox@gmail.com"
          />
        </div>

        {/* Password Field */}
        <div className="relative rounded-xl border border-stone-300 bg-white focus-within:border-stone-800 focus-within:ring-1 focus-within:ring-stone-800/20 transition-all duration-300">
          <label className="absolute -top-2 left-4 bg-white px-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider font-sans leading-none pointer-events-none select-none">
            Password
          </label>
          
          <div className="flex items-center justify-between pr-3">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={loading}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full border-0 bg-transparent px-4 py-3 text-xs text-stone-900 placeholder-transparent focus:ring-0 focus:outline-none disabled:opacity-50 font-sans"
              placeholder="••••••••"
            />
            
            {/* Visual Strength Badge + Visibility Toggle */}
            <div className="flex items-center gap-2 select-none">
              {password.length >= 6 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                  Strong ✓
                </span>
              )}
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-400 hover:text-stone-700 focus:outline-none"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Remember Checkbox */}
        <div className="flex items-center gap-2 px-1 select-none animate-stagger-4">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-3.5 w-3.5 rounded bg-stone-100 border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-offset-0 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-sans cursor-pointer">
            Remember me
          </label>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50/85 px-4 py-2.5 text-xs text-red-700 border border-red-200/50 shadow-sm animate-tag-reveal">
            ⚠️ {error}
          </div>
        )}
        {info && (
          <div className="rounded-2xl bg-amber-50/85 px-4 py-2.5 text-xs text-amber-800 border border-amber-200/50 shadow-sm animate-tag-reveal">
            {info}
          </div>
        )}

        {/* Dotted Grid Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative inline-flex h-11 w-full items-center justify-center rounded-full bg-black text-xs font-bold text-white shadow-lg overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {/* Subtle overlay dotted grid pattern */}
          <div className="absolute inset-0 z-0 dot-grid pointer-events-none" />
          
          <span className="relative z-10 font-sans tracking-widest uppercase">
            {emailLoading ? "Creating account..." : "Start your adventure"}
          </span>
        </button>
      </form>
    </div>
  );
}

/** Only allow same-origin relative paths to prevent open-redirect attacks. */
function safeRedirect(raw: string | null): string {
  if (!raw) return "/account";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/account";
}
