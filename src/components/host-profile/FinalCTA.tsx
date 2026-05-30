import Link from "next/link";
import Image from "next/image";

type FinalCTAProps = {
  hostId: string;
  firstName: string;
  isOwnProfile: boolean;
  backgroundImage: string;
};

export function FinalCTA({
  hostId,
  firstName,
  isOwnProfile,
  backgroundImage,
}: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      <Image
        src={backgroundImage}
        alt=""
        fill
        unoptimized
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/55 to-black/40" />

      <div className="relative px-8 py-14 sm:px-12 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">
          Ready for your next adventure?
        </p>
        <h2
          className="mt-4 max-w-xl font-serif font-semibold leading-tight text-white"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
        >
          Connect with {isOwnProfile ? "travellers" : firstName}, ask a question, or join the next trip.
        </h2>

        <div className="mt-8 flex flex-wrap gap-3">
          {isOwnProfile ? (
            <>
              <Link
                href="/host/new"
                className="inline-flex h-11 items-center rounded-full bg-white px-6 text-[14px] font-bold text-[#17120f] transition hover:bg-white/90"
              >
                Post a trip
              </Link>
              <Link
                href="/account/profile"
                className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-[14px] font-bold text-white transition hover:bg-white/10"
              >
                Edit profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/messages?hostId=${hostId}`}
                className="inline-flex h-11 items-center rounded-full bg-white px-6 text-[14px] font-bold text-[#17120f] transition hover:bg-white/90"
              >
                Connect
              </Link>
              <Link
                href={`/messages?hostId=${hostId}`}
                className="inline-flex h-11 items-center rounded-full border border-white/40 px-6 text-[14px] font-bold text-white transition hover:bg-white/10"
              >
                Message {firstName}
              </Link>
              <a
                href="#trips"
                className="inline-flex h-11 items-center rounded-full border border-white/30 px-6 text-[14px] font-semibold text-white/90 transition hover:bg-white/10"
              >
                Book trip
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
