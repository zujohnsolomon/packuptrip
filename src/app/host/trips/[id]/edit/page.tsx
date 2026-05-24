import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TripEditor } from "@/components/host/TripEditor";
import { updateMyTrip } from "../../../actions";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/types/db";

export const metadata = {
  title: "Edit trip · Packuptrip",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HostEditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/host/trips/${id}/edit`);

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle<Trip>();
  if (!trip) notFound();
  if (trip.host_id !== user.id) notFound();

  // Editing live or completed trips isn't allowed via this flow.
  if (
    trip.status === "live" ||
    trip.status === "completed" ||
    trip.status === "cancelled"
  ) {
    redirect(`/host/trips/${id}`);
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
                Edit trip
              </h1>
              <p className="mt-1 max-w-xl text-sm text-stone-600">
                {trip.status === "pending"
                  ? "Trip is currently with admin. Saving keeps it in the queue; resubmit applies your edits and starts a fresh review."
                  : trip.rejection_reason
                    ? "Rejected by admin. Fix the issues from their feedback below, then resubmit."
                    : "Update what you like, then save the draft or submit for admin review."}
              </p>
              {trip.rejection_reason && (
                <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs ring-1 ring-inset ring-red-100">
                  <div className="font-semibold text-red-800">
                    Admin feedback
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-red-900">
                    {trip.rejection_reason}
                  </p>
                </div>
              )}
              {trip.admin_notes && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs ring-1 ring-inset ring-amber-100">
                  <div className="font-semibold text-amber-800">
                    Changes requested
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-amber-900">
                    {trip.admin_notes}
                  </p>
                </div>
              )}
            </div>
            <Link
              href={`/host/trips/${trip.id}`}
              className="hidden text-sm font-medium text-stone-600 hover:text-ink sm:inline"
            >
              ← Back
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <TripEditor
            mode="edit"
            action={updateMyTrip}
            defaults={{
              id: trip.id,
              title: trip.title,
              location: trip.location,
              description: trip.description ?? "",
              days: trip.days,
              price_per_share: Number(trip.price_per_share),
              start_date: trip.start_date,
              spots_total: trip.spots_total,
              spots_left: trip.spots_left,
              status: trip.status,
              images: trip.images ?? [],
              itinerary: trip.itinerary ?? [],
              tags: trip.tags ?? [],
              includes: trip.includes ?? [],
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
