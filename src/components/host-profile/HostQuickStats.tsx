import { GlobeIcon, HeartStatIcon, StarIcon, TripIcon } from "./icons";
import { yearsHosting } from "./utils";

type HostQuickStatsProps = {
  totalHosted: number;
  happyTravelersCount: number;
  countriesCount: number;
  avgRating: number | null;
  reviewCount: number;
  memberSince: string;
  responseRate?: string;
};

export function HostQuickStats({
  totalHosted,
  happyTravelersCount,
  countriesCount,
  avgRating,
  reviewCount,
  memberSince,
  responseRate = "98%",
}: HostQuickStatsProps) {
  const years = yearsHosting(memberSince);

  const stats = [
    { icon: <TripIcon />, value: String(totalHosted), label: "Trips hosted" },
    { icon: <HeartStatIcon />, value: String(happyTravelersCount), label: "Travelers hosted" },
    { icon: <GlobeIcon size={18} />, value: String(countriesCount), label: "Countries visited" },
    {
      icon: <StarIcon size={18} />,
      value: avgRating ? avgRating.toFixed(1) : "—",
      label: `${reviewCount} reviews`,
      star: avgRating != null,
    },
    { icon: <TripIcon />, value: String(years), label: "Years hosting" },
    { icon: <HeartStatIcon />, value: responseRate, label: "Response rate" },
  ];

  return (
    <section className="border-b border-stone-200/80 bg-[#f8f5ef] py-6 md:hidden">
      <div className="mx-auto flex max-w-[1400px] gap-3 overflow-x-auto px-6 pb-1 sm:px-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-[120px] shrink-0 flex-col items-center rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-stone-400">{stat.icon}</span>
            <span className="mt-1 flex items-center gap-0.5 text-xl font-bold text-[#17120f]">
              {stat.value}
              {"star" in stat && stat.star && (
                <span className="text-sm text-[#e0a23c]">★</span>
              )}
            </span>
            <span className="mt-0.5 text-center text-[10px] font-medium text-stone-500">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HostQuickStatsDesktop({
  totalHosted,
  happyTravelersCount,
  countriesCount,
  avgRating,
  reviewCount,
  memberSince,
}: Omit<HostQuickStatsProps, "responseRate">) {
  const years = yearsHosting(memberSince);

  const stats = [
    { value: String(totalHosted), label: "Trips hosted" },
    { value: String(happyTravelersCount), label: "Travelers hosted" },
    { value: String(countriesCount), label: "Countries" },
    { value: avgRating ? avgRating.toFixed(1) : "—", label: "Rating", star: avgRating != null },
    { value: String(years), label: "Years hosting" },
    { value: "98%", label: "Response rate" },
  ];

  return (
    <section className="hidden border-b border-stone-200/80 bg-white md:block">
      <div className="mx-auto grid max-w-[1400px] grid-cols-6 divide-x divide-stone-100 px-6 py-5 sm:px-10">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[#17120f]">
              {stat.value}
              {"star" in stat && stat.star && (
                <span className="text-sm text-[#e0a23c]">★</span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
