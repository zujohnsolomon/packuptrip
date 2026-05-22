import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Sign up · Packuptrip" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <div className="mx-auto w-full max-w-md flex-1 px-6 py-12 sm:py-20">
        <Logo />
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Join Packuptrip
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Find your trip, or find your people.
          </p>
          <div className="mt-6">
            <SignupForm />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-700 hover:text-amber-800"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
