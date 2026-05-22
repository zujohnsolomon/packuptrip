import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

export const metadata = { title: "Your account · Packuptrip" };

export default async function AccountPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <>
      <Header />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Welcome, {profile?.name ?? user.email}
          </h1>
          <p className="mt-1 text-stone-600">
            This is your account. Bookings, hosted trips, and reviews will live
            here.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <PanelStub
              title="Your bookings"
              body="Trips you&rsquo;ve joined or packages you&rsquo;ve booked will appear here."
            />
            <PanelStub
              title="Your hosted trips"
              body="Trips you&rsquo;ve posted as a host will appear here."
            />
          </div>

          <form action="/auth/logout" method="post" className="mt-10">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
            >
              Log out
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SupabaseNotConfigured() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)]">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Supabase not configured yet
            </h1>
            <p className="mt-2 text-stone-600">
              Add your Supabase URL and anon key to{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              and restart the dev server. See{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
                supabase/README.md
              </code>{" "}
              for the 5-step setup.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PanelStub({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-stone-600">{body}</p>
      <div className="mt-4 text-xs uppercase tracking-wider text-stone-400">
        Coming soon
      </div>
    </div>
  );
}
