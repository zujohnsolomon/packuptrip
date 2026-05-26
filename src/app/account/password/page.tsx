import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Change password · Packuptrip" };

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/account/password");

  // If user signed up via Google OAuth they have no password to change
  const isOAuthOnly =
    user.app_metadata?.provider === "google" &&
    !(user.identities ?? []).some((i) => i.provider === "email");

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <Link
            href="/account"
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← Account
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            Change password
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Choose a strong password you don't use anywhere else.
          </p>

          <div className="mt-8">
            {isOAuthOnly ? (
              <div className="rounded-2xl border border-stone-100 bg-stone-50 p-6 text-center">
                <p className="text-sm font-medium text-stone-700">
                  You signed in with Google
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Your account uses Google for authentication — there's no
                  separate Packuptrip password to change.
                </p>
              </div>
            ) : (
              <PasswordForm />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
