import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { TripEditor, blankTrip } from "@/components/host/TripEditor";
import { createTrip } from "../actions";

export const metadata = {
  title: "Post a trip · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  // Auth gate - must be signed in to host.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/host/new");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-stone-50 pt-20">
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-baseline justify-between gap-4 px-6 py-6 lg:px-8">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
                Hosting
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Post a community trip
              </h1>
              <p className="mt-1 max-w-xl text-sm text-stone-600">
                Save a draft whenever - only you can see it. Submit when
                you&rsquo;re ready for the admin team to review (usually
                within 24 hours).
              </p>
            </div>
            <Link
              href="/host"
              className="hidden text-sm font-medium text-stone-600 hover:text-ink sm:inline"
            >
              ← Back
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <TripEditor mode="create" defaults={blankTrip} action={createTrip} />
        </div>
      </main>
      <Footer />
    </>
  );
}
