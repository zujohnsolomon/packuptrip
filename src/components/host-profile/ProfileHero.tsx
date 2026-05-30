import Image from "next/image";
import type { Profile } from "@/types/db";
import { deriveEditorialCopy } from "./utils";
import { HeartStatIcon, PinIcon, StarIcon, TripIcon, VerifiedSeal } from "./icons";

type ProfileHeroProps = {
  profile: Profile;
  coverPhoto: string;
  totalHosted: number;
  happyTravelersCount: number;
  avgRating: number | null;
  reviewCount: number;
};

function HeroStatRow({
  icon,
  value,
  label,
  stars,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  stars?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-stone-100 px-5 py-3.5 first:border-t-0">
      <span className="shrink-0 text-stone-400">{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[20px] font-bold leading-none text-[#17120f]">{value}</span>
          {stars && (
            <span className="flex gap-0.5 text-[12px] text-[#e0a23c]">
              ★★★★★
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-stone-500">{label}</p>
      </div>
    </div>
  );
}

function HeroWave() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-px">
      <svg
        viewBox="0 0 1440 88"
        preserveAspectRatio="none"
        className="block h-[72px] w-full sm:h-[88px]"
        aria-hidden
      >
        <path
          d="M0,48 C240,88 480,8 720,44 C960,80 1200,24 1440,52 L1440,88 L0,88 Z"
          fill="#f8f5ef"
        />
      </svg>
    </div>
  );
}

export function ProfileHero({
  profile,
  coverPhoto,
  totalHosted,
  happyTravelersCount,
  avgRating,
  reviewCount,
}: ProfileHeroProps) {
  const firstName = profile.name.split(" ")[0] || "This host";
  const { headline, subheadline } = deriveEditorialCopy(profile, firstName);
  const localTime = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <section className="relative">
      {/* Hero image */}
      <div className="relative h-[min(52vh,480px)] min-h-[360px] overflow-hidden">
        <Image
          src={coverPhoto}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        {/* Light left scrim — readable dark text like mockup */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1240px] items-center justify-between gap-6 px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          {/* Left copy */}
          <div className="max-w-md pt-2 text-[#17120f]">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#c45c3e]">
              Trip Host
            </p>
            <h1
              className="mt-3 font-serif font-semibold leading-[1.08] tracking-tight"
              style={{ fontSize: "clamp(1.85rem, 3.5vw, 2.75rem)" }}
            >
              {headline}
            </h1>
            <p className="mt-3 text-[14px] leading-7 text-stone-600">{subheadline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-stone-500">
              {profile.home_city && (
                <span className="flex items-center gap-1.5">
                  <PinIcon size={13} />
                  {profile.home_city}
                </span>
              )}
              {profile.home_city && <span className="text-stone-300">|</span>}
              <span>
                Local time{" "}
                <strong className="font-semibold text-stone-700">{localTime}</strong>
              </span>
            </div>
          </div>

          {/* White stats card */}
          <div className="hidden w-[212px] shrink-0 overflow-hidden rounded-2xl border border-stone-100 bg-white/95 shadow-[0_20px_50px_rgba(41,37,36,0.18)] backdrop-blur-sm md:block">
            <HeroStatRow icon={<TripIcon />} value={String(totalHosted)} label="Trips Hosted" />
            <HeroStatRow
              icon={<HeartStatIcon />}
              value={String(happyTravelersCount)}
              label="Happy Travelers"
            />
            <HeroStatRow
              icon={<StarIcon size={18} />}
              value={avgRating ? avgRating.toFixed(1) : "—"}
              label={`(${reviewCount} review${reviewCount !== 1 ? "s" : ""})`}
              stars={avgRating != null}
            />
          </div>
        </div>

        <HeroWave />
      </div>

      {/* Centered identity — overlaps wave */}
      <div className="relative z-30 mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="-mt-[72px] flex flex-col items-center text-center sm:-mt-[84px]">
          <div className="relative">
            <div className="relative h-[118px] w-[118px] overflow-hidden rounded-full bg-stone-200 shadow-[0_16px_40px_rgba(41,37,36,0.22)] ring-[5px] ring-[#f8f5ef] sm:h-[142px] sm:w-[142px]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  fill
                  unoptimized
                  sizes="142px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center font-serif text-5xl text-stone-400">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {profile.host_tier === "superhost" && (
              <span
                title="Superhost"
                className="absolute bottom-1 right-0.5 grid h-9 w-9 place-items-center rounded-full bg-[#2d5130] text-white ring-4 ring-[#f8f5ef]"
              >
                <StarIcon size={14} />
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <h2
              className="font-serif font-semibold tracking-tight text-[#17120f]"
              style={{ fontSize: "clamp(1.85rem, 3vw, 2.35rem)" }}
            >
              {profile.name}
            </h2>
            {profile.id_verified && <VerifiedSeal />}
          </div>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-stone-500">
            Travel Host
          </p>
          <p
            className="mt-2 text-[22px] text-stone-600 sm:text-[24px]"
            style={{ fontFamily: "var(--font-caveat), cursive" }}
          >
            Meet people. Share stories. Create memories.
          </p>
        </div>
      </div>
    </section>
  );
}
