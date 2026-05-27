import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata = { title: "Page not found · Packuptrip" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white pt-20">
        {/* Hero image strip */}
        <div className="relative h-56 w-full overflow-hidden sm:h-72">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=75"
            alt="Mountain ridge at golden hour"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-white" />
        </div>

        {/* Content */}
        <div className="mx-auto max-w-lg px-4 pb-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
            404
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Lost in the mountains?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-500">
            This page doesn't exist — but your next adventure does.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/trips"
              className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-500 px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
            >
              Browse trips
            </Link>
            <Link
              href="/packages"
              className="inline-flex h-11 items-center justify-center rounded-full border border-stone-200 bg-white px-7 text-sm font-semibold text-ink transition-colors hover:bg-stone-50"
            >
              Browse packages
            </Link>
          </div>

          {/* Secondary nav */}
          <div className="mt-10 flex items-center justify-center gap-5 text-sm text-stone-400">
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <span aria-hidden>·</span>
            <Link href="/host" className="hover:text-ink transition-colors">
              Become a host
            </Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="hover:text-ink transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
