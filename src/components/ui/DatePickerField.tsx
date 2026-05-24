"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

/**
 * Branded date-picker that behaves like a form input.
 *
 * - Renders a tappable field (matches the search-bar look) with eyebrow label.
 * - Opens a popover calendar styled to the Packuptrip brand.
 * - Selection writes to a hidden `<input name={name}>` so plain HTML form
 *   submission keeps working (we use GET forms for filters).
 * - `tone="dark"` is for use on dark backgrounds (hero search over photo);
 *   "light" is for cream backgrounds (FilterBar on browse pages).
 */
export function DatePickerField({
  name,
  label,
  defaultValue,
  placeholder = "Any date",
  minDate,
  tone = "light",
  align = "left",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  minDate?: Date;
  tone?: Tone;
  align?: "left" | "right";
}) {
  const initial = defaultValue && isValid(parseISO(defaultValue))
    ? parseISO(defaultValue)
    : undefined;
  const [selected, setSelected] = useState<Date | undefined>(initial);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Outside click + Escape close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isoValue = selected ? format(selected, "yyyy-MM-dd") : "";
  const display = selected ? format(selected, "EEE d MMM") : placeholder;

  const labelClass =
    tone === "dark"
      ? "text-white/70"
      : "text-stone-500";
  const valueClass = selected
    ? tone === "dark"
      ? "text-white"
      : "text-ink"
    : tone === "dark"
      ? "text-white/50"
      : "text-stone-400";

  return (
    <div ref={rootRef} className="relative">
      {/* Hidden field so the surrounding <form> can read the value */}
      <input type="hidden" name={name} value={isoValue} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "block w-full cursor-pointer rounded-xl px-4 py-2.5 text-left transition-colors sm:py-3",
          tone === "dark"
            ? "hover:bg-white/5"
            : "hover:bg-stone-50",
        )}
      >
        <div
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            labelClass,
          )}
        >
          {label}
        </div>
        <div className={cn("mt-0.5 text-sm", valueClass)}>{display}</div>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Select ${label.toLowerCase()}`}
          className={cn(
            "absolute z-50 mt-2 w-[20rem] rounded-2xl bg-white p-3 shadow-[var(--shadow-search)] ring-1 ring-stone-200",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <Calendar
            selected={selected}
            onSelect={(d) => {
              setSelected(d);
              if (d) setOpen(false);
            }}
            minDate={minDate}
          />
          {selected && (
            <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
              <button
                type="button"
                onClick={() => setSelected(undefined)}
                className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-ink hover:underline"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Calendar({
  selected,
  onSelect,
  minDate,
}: {
  selected: Date | undefined;
  onSelect: (d: Date | undefined) => void;
  minDate?: Date;
}) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      disabled={minDate ? { before: minDate } : undefined}
      showOutsideDays
      classNames={{
        root: "p-1",
        months: "flex flex-col",
        month: "space-y-2",
        month_caption: "flex items-center justify-center px-1 py-2",
        caption_label:
          "font-serif text-base font-medium text-ink tracking-tight",
        nav: "flex items-center justify-between absolute inset-x-1 top-1.5 pointer-events-none",
        button_previous:
          "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-ink transition",
        button_next:
          "pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-ink transition",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-10 text-[11px] font-semibold uppercase tracking-wider text-stone-400",
        week: "flex w-full mt-1",
        day: "h-10 w-10 p-0 text-sm text-stone-700 relative",
        day_button:
          "h-9 w-9 rounded-full inline-flex items-center justify-center transition-colors hover:bg-amber-100 hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
        selected:
          "[&_button]:bg-amber-600 [&_button]:text-white [&_button:hover]:bg-amber-700 [&_button:hover]:text-white",
        today:
          "[&_button]:ring-1 [&_button]:ring-inset [&_button]:ring-amber-300 [&_button]:font-semibold",
        outside: "text-stone-300",
        disabled: "text-stone-300 [&_button]:cursor-not-allowed [&_button:hover]:bg-transparent [&_button:hover]:text-stone-300",
        hidden: "invisible",
      }}
      components={{
        Chevron: ({ orientation }) => (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {orientation === "left" ? (
              <polyline points="15 18 9 12 15 6" />
            ) : (
              <polyline points="9 18 15 12 9 6" />
            )}
          </svg>
        ),
      }}
    />
  );
}
