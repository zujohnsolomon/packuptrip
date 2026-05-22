import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · Packuptrip" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <div className="mx-auto w-full max-w-md flex-1 px-6 py-12 sm:py-20">
        <Logo />
        <div className="mt-10 rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Log in to manage your trips and bookings.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-stone-600">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-amber-700 hover:text-amber-800"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
