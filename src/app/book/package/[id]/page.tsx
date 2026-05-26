import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BookingForm } from "@/components/booking/BookingForm";
import { createClient } from "@/lib/supabase/server";
import { getLivePackage, getLivePricingRates } from "@/lib/supabase/queries";

export const metadata = { title: "Confirm booking · Packuptrip" };

export default async function BookPackagePage({
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
    redirect(`/login?redirectTo=/book/package/${id}`);
  }

  const [pkg, rates, profileResult] = await Promise.all([
    getLivePackage(id),
    getLivePricingRates(),
    supabase.from("profiles").select("plus_member").eq("id", user.id).maybeSingle<{ plus_member: boolean }>(),
  ]);
  if (!pkg) notFound();

  const isPlus = profileResult.data?.plus_member === true;
  const serviceFeeRate = isPlus ? rates.plusFeeRate : rates.serviceFeeRate;

  if (pkg.spots_left <= 0) {
    return <SoldOut href={`/packages/${pkg.id}`} title={pkg.title} />;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href={`/packages/${pkg.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to trip
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Confirm your spot
          </h1>
          <p className="mt-1 text-stone-600">
            Review the trip and lock in your booking. No payment today.
          </p>

          <div className="mt-8 grid gap-8 md:grid-cols-[1.4fr_1fr] md:gap-12">
            <BookingSummary
              variant="originals"
              title={pkg.title}
              location={pkg.location}
              image={pkg.images[0] ?? ""}
              startDate={pkg.start_date}
              days={pkg.days}
              basePrice={Number(pkg.price)}
              unitLabel="Per person"
            />
            <BookingForm
              itemType="package"
              itemId={pkg.id}
              basePrice={Number(pkg.price)}
              accent="amber"
              serviceFeeRate={serviceFeeRate}
              isPlus={isPlus}
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
            <h1 className="text-2xl font-semibold text-ink">
              Sold out
            </h1>
            <p className="mt-2 text-stone-600">
              {title} is fully booked. Browse other Packuptrip Originals - new
              departures are added regularly.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href={href}
                className="inline-flex h-11 items-center rounded-full border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Trip details
              </Link>
              <Link
                href="/packages"
                className="inline-flex h-11 items-center rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                Browse packages
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
