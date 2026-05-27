import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getReferralProfile } from "@/lib/supabase/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = await getReferralProfile(code);
  if (!profile) return { title: "Join Packuptrip" };
  return {
    title: `${profile.name} invited you · Packuptrip`,
    description: `${profile.name} is using Packuptrip to discover and join incredible group trips. Join and get ₹200 off your first booking.`,
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const profile = await getReferralProfile(code);

  // Unknown code → send to signup anyway (no reward, but don't 404)
  if (!profile) {
    redirect(`/signup`);
  }

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const signupHref = `/signup?ref=${code}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        <div className="mx-auto max-w-md px-4 py-20 sm:px-6">

          {/* Card */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-green-50 p-8 ring-1 ring-inset ring-indigo-100 text-center">

            {/* Referrer avatar */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-green-100 ring-4 ring-white shadow-md">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-green-800">
                  {initials}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-800">
              Personal invite from
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {profile.name}
            </h1>

            {/* Reward pill */}
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-2 text-sm font-bold text-white shadow">
              🎁 Get ₹200 off your first trip
            </div>

            <p className="mt-5 text-sm leading-relaxed text-stone-600">
              {profile.name.split(" ")[0]} uses Packuptrip to join group trips
              with like-minded travellers. Create your free account and your
              ₹200 credit will be waiting on your first booking.
            </p>

            {/* CTA */}
            <Link
              href={signupHref}
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow hover:bg-stone-700"
            >
              Accept invite & create account →
            </Link>

            <p className="mt-4 text-xs text-stone-400">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-stone-600 hover:text-ink">
                Sign in
              </Link>
            </p>
          </div>

          {/* Social proof strip */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🏔️", label: "Curated trips" },
              { icon: "🤝", label: "Verified hosts" },
              { icon: "🔒", label: "Secure booking" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-stone-50 px-3 py-4">
                <div className="text-2xl">{item.icon}</div>
                <p className="mt-1 text-[11px] font-semibold text-stone-600">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
