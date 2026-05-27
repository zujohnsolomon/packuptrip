"use client";

import { useState, useRef, useEffect } from "react";

type MonthOption = {
  year: number;
  month: number; // 0-indexed
  monthName: string;
};

function getNext12Months(): MonthOption[] {
  const result: MonthOption[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      monthName: d.toLocaleDateString("en-IN", { month: "long" }),
    });
  }
  return result;
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function MonthPicker() {
  const [selected, setSelected] = useState<MonthOption | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const months = getNext12Months();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // First and last day of selected month — passed as from/to query params
  const fromValue = selected
    ? toDateString(selected.year, selected.month, 1)
    : "";
  const toValue = selected
    ? toDateString(
        selected.year,
        selected.month,
        new Date(selected.year, selected.month + 1, 0).getDate()
      )
    : "";

  const displayLabel = selected
    ? `${selected.monthName} ${selected.year}`
    : null;

  function pick(m: MonthOption) {
    setSelected(m);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Hidden form fields — submitted with the search form */}
      <input type="hidden" name="from" value={fromValue} />
      <input type="hidden" name="to" value={toValue} />

      {/* ── Field button ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col rounded-xl px-4 py-2.5 text-left transition-colors hover:bg-stone-50 sm:py-3"
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          From
        </div>
        <span className={`mt-0.5 block text-sm ${displayLabel ? "text-ink" : "text-stone-400"}`}>
          {displayLabel ?? "Any date"}
        </span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute right-0 top-full z-50 mt-2 rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
            style={{ width: "min(680px, calc(100vw - 1.5rem))" }}
          >
            <p className="mb-5 text-[15px] font-semibold text-stone-900">
              Departure month
            </p>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {months.map((m) => {
                const isSelected =
                  selected?.year === m.year && selected?.month === m.month;
                return (
                  <button
                    key={`${m.year}-${m.month}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pick(m); }}
                    className={`rounded-xl px-3 py-3.5 text-left transition-all ${
                      isSelected
                        ? "border border-yellow-500 bg-yellow-50 ring-1 ring-yellow-400"
                        : "border border-dashed border-stone-300 hover:border-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <span className="block text-[14px] font-medium leading-tight text-stone-800">
                      {m.monthName}
                    </span>
                    <span className="mt-1 block text-[13px] leading-tight text-stone-400">
                      {m.year}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
