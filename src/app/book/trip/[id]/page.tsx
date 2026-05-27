import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BookingForm } from "@/components/booking/BookingForm";
import { createClient } from "@/lib/supabase/server";
import { getLiveTrip, getLivePricingRates } from "@/lib/supabase/queries";

export const metadata = { title: "Join this trip · Packuptrip" };

export default async function BookTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/book/trip/${id}`);
  }

  const [res, rates, profileResult] = await Promise.all([
    getLiveTrip(id),
    getLivePricingRates(),
    supabase
      .from("profiles")
      .select("plus_member, promo_credits, referral_credits")
      .eq("id", user.id)
      .maybeSingle<{ plus_member: boolean; promo_credits: number; referral_credits: number }>(),
  ]);
  if (!res) notFound();
  const { trip, host } = res;

  // Plus members pay half the service fee
  const isPlus = profileResult.data?.plus_member === true;
  const serviceFeeRate = isPlus
    ? (rates.plusFeeRate ?? rates.serviceFeeRate / 2)
    : rates.serviceFeeRate;

  const availableCredit =
    (profileResult.data?.promo_credits ?? 0) +
    (profileResult.data?.referral_credits ?? 0);

  if (trip.spots_left <= 0) {
    return <SoldOut href={`/trips/${trip.id}`} title={trip.title} />;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to trip
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Join the trip
          </h1>
          <p className="mt-1 text-stone-600">
            {host
              ? `Reserve your share of ${host.name}'s trip. No payment today.`
              : "Reserve your share. No payment today."}
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
            <BookingSummary
              variant="community"
              title={trip.title}
              location={trip.location}
              image={trip.images[0] ?? ""}
              startDate={trip.start_date}
              days={trip.days}
              basePrice={Number(trip.price_per_share)}
              unitLabel="Per share"
            />
            <BookingForm
              itemType="trip"
              itemId={trip.id}
              basePrice={Number(trip.price_per_share)}
              accent="teal"
              serviceFeeRate={serviceFeeRate}
              isPlus={isPlus}
              availableCredit={availableCredit}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SoldOut({ href, title }: { href: string; title: string }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h1 className="text-2xl font-semibold text-ink">All spots taken</h1>
            <p className="mt-2 text-stone-600">
              {title} has no spots left. Browse other open community trips -
              new ones go up every week.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href={href}
                className="inline-flex h-11 items-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Trip details
              </Link>
              <Link
                href="/trips"
                className="inline-flex h-11 items-center rounded-full bg-green-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-green-800"
              >
                Browse trips
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
