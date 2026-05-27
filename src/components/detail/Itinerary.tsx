import type { ItineraryDay } from "@/types/db";

export function Itinerary({
  days,
  accent,
}: {
  days: ItineraryDay[];
  accent: "amber" | "teal";
}) {
  if (!days || days.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-500">
        Itinerary coming soon.
      </div>
    );
  }
  const dot =
    accent === "amber"
      ? "bg-yellow-600 ring-yellow-100"
      : "bg-green-700 ring-green-100";
  return (
    <ol className="relative space-y-6 border-l border-stone-200 pl-6">
      {days.map((d) => (
        <li key={d.day} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[33px] top-1.5 grid h-5 w-5 place-items-center rounded-full ring-4 ${dot}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Day {d.day}
          </div>
          <div className="mt-1 text-base font-semibold text-ink">{d.title}</div>
          <p className="mt-1 text-sm text-stone-600">{d.description}</p>
        </li>
      ))}
    </ol>
  );
}
