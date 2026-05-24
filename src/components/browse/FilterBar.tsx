import { formatINR } from "@/lib/utils";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { format, parseISO, isValid } from "date-fns";

/** GET form - values land in URL search params; the page re-renders with
 *  filtered data on submit. No JS required.
 *
 *  `action` is the path of the current browse page (/packages or /trips).
 */
export function FilterBar({
  action,
  accent,
  defaults,
}: {
  action: string;
  accent: "amber" | "teal";
  defaults?: { q?: string; from?: string; to?: string; max?: string };
}) {
  const ring =
    accent === "amber"
      ? "focus:border-amber-500 focus:ring-amber-100"
      : "focus:border-teal-500 focus:ring-teal-100";
  const btn =
    accent === "amber"
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-teal-600 hover:bg-teal-700";

  return (
    <form
      action={action}
      method="get"
      className="rounded-2xl bg-white p-3 shadow-[var(--shadow-card)] sm:p-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Field label="Where" htmlFor="q">
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={defaults?.q ?? ""}
            placeholder="Spiti, Kerala…"
            className={`block w-full bg-transparent text-sm text-ink placeholder-stone-400 focus:outline-none`}
          />
        </Field>
        <Divider />
        <div className="flex-1">
          <DatePickerField
            name="from"
            label="From"
            defaultValue={defaults?.from}
            placeholder="Any date"
            minDate={new Date()}
            tone="light"
          />
        </div>
        <Divider />
        <div className="flex-1">
          <DatePickerField
            name="to"
            label="To"
            defaultValue={defaults?.to}
            placeholder="Any date"
            minDate={
              defaults?.from && isValid(parseISO(defaults.from))
                ? parseISO(defaults.from)
                : new Date()
            }
            tone="light"
          />
        </div>
        <Divider />
        <Field label="Max price (₹)" htmlFor="max">
          <input
            id="max"
            name="max"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={defaults?.max ?? ""}
            placeholder="Any"
            className="block w-full bg-transparent text-sm text-ink placeholder-stone-400 focus:outline-none"
          />
        </Field>
        <button
          type="submit"
          className={`mt-2 inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-sm transition sm:mt-0 sm:h-auto sm:px-7 ${btn} ${ring}`}
        >
          Search
        </button>
      </div>

      {(defaults?.q || defaults?.from || defaults?.to || defaults?.max) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-2 pb-1 text-xs text-stone-600">
          <span>Filtering:</span>
          {defaults?.q && <Chip>where “{defaults.q}”</Chip>}
          {defaults?.from && <Chip>from {prettyDate(defaults.from)}</Chip>}
          {defaults?.to && <Chip>to {prettyDate(defaults.to)}</Chip>}
          {defaults?.max && <Chip>up to {formatINR(Number(defaults.max))}</Chip>}
          <a
            href={action}
            className="ml-auto text-xs font-semibold text-stone-500 underline-offset-2 hover:text-ink hover:underline"
          >
            Clear filters
          </a>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex-1 cursor-text rounded-xl px-4 py-2.5 transition-colors hover:bg-stone-50 sm:py-3"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function Divider() {
  return <div className="hidden w-px self-stretch bg-stone-200 sm:block" />;
}

function prettyDate(iso: string) {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM") : iso;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5">
      {children}
    </span>
  );
}
