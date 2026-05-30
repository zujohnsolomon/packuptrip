import { WorldMap } from "@/components/shared/WorldMap";
import { COUNTRY_NAME_BY_CODE } from "@/lib/countries";
import { GlobeIcon, SectionLabel } from "./icons";

type VisitedCountriesMapProps = {
  countries: string[];
  className?: string;
};

export function VisitedCountriesMap({ countries, className = "" }: VisitedCountriesMapProps) {
  if (countries.length === 0) return null;

  const countryNames = countries
    .map((code) => COUNTRY_NAME_BY_CODE.get(code) ?? code)
    .sort((a, b) => a.localeCompare(b));

  const visible = countryNames.slice(0, 8);
  const remaining = countryNames.length - visible.length;

  return (
    <section
      id="stories"
      className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_10px_30px_rgba(64,44,26,0.06)] ${className}`}
    >
      <div className="grid lg:grid-cols-[1fr_280px]">
        <div className="relative min-h-[280px] bg-[#eef3ee] p-5 sm:min-h-[340px]">
          <SectionLabel>World travelled</SectionLabel>
          <p className="mt-2 font-serif text-2xl text-[#17120f]">
            {countries.length} {countries.length === 1 ? "country" : "countries"} explored
          </p>
          <div className="mt-4 overflow-hidden rounded-xl bg-white/60">
            <WorldMap visited={countries} className="rounded-xl" />
          </div>
        </div>

        <aside className="border-t border-stone-100 p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-stone-500">
            <GlobeIcon size={16} />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em]">Visited</h3>
          </div>
          <ul className="mt-4 space-y-2">
            {visible.map((name) => (
              <li
                key={name}
                className="flex items-center gap-2 text-[13px] font-medium text-stone-700"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2d5130]" />
                {name}
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <p className="mt-3 text-[12px] font-semibold text-stone-400">+ {remaining} more</p>
          )}
        </aside>
      </div>
    </section>
  );
}
