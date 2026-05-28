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
    supabase
      .from("profiles")
      .select("plus_member, promo_credits, referral_credits")
      .eq("id", user.id)
      .maybeSingle<{ plus_member: boolean; promo_credits: number; referral_credits: number }>(),
  ]);
  if (!pkg) notFound();

  const isPlus = profileResult.data?.plus_member === true;
  const serviceFeeRate = isPlus ? rates.plusFeeRate : rates.serviceFeeRate;

  const availableCredit =
    (profileResult.data?.promo_credits ?? 0) +
    (profileResult.data?.referral_credits ?? 0);

  if (pkg.spots_left <= 0) {
    return <SoldOut href={`/packages/${pkg.id}`} title={pkg.title} />;
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f6f1ea] pt-20">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href={`/packages/${pkg.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-ink"
          >
            ← Back to package
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-yellow-500">
            · Confirm your spot ·
          </p>
          <h1
            className="mt-3 font-serif font-medium leading-[1.05] tracking-tight text-ink"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Confirm your booking
          </h1>
          <p className="mt-3 max-w-xl text-stone-600">
            Review the trip and lock in your spot. No payment is taken today.
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
      <main className="flex-1 bg-[#f6f1ea] pt-20">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-card)]">
            <h1
              className="font-serif font-medium text-ink"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontVariationSettings: "'opsz' 144" }}
            >
              Sold out
            </h1>
            <p className="mt-2 text-stone-600">
              {title} is fully booked. Browse other Packuptrip Originals — new
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
                className="inline-flex h-11 items-center rounded-full bg-yellow-400 px-5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-yellow-500"
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
