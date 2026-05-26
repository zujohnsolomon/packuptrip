"use client";

import { useState, useRef, useEffect } from "react";

type Region = {
  label: string;
  places: string[];
};

const DESTINATIONS: Region[] = [
  {
    label: "South India",
    places: ["Tamil Nadu", "Kerala", "Karnataka", "Goa", "Pondicherry"],
  },
  {
    label: "Himalayas",
    places: ["Ladakh", "Spiti Valley", "Manali", "Uttarakhand", "Himachal Pradesh"],
  },
  {
    label: "Northeast India",
    places: ["Meghalaya", "Sikkim", "Arunachal Pradesh", "Assam", "Nagaland"],
  },
  {
    label: "Coastal & Islands",
    places: ["Andaman", "Kerala Coast", "Lakshadweep", "Goa Beaches", "Konkan Coast"],
  },
  {
    label: "Rajasthan & Heritage",
    places: ["Rajasthan", "Madhya Pradesh", "Gujarat", "Varanasi", "Hampi"],
  },
  {
    label: "Wildlife",
    places: ["Jim Corbett", "Ranthambore", "Kabini", "Tadoba", "Bandhavgarh"],
  },
];

export function DestinationPicker({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(name: string) {
    setValue(name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">

      {/* ── Input field ── */}
      <label className="block cursor-text rounded-xl px-4 py-2.5 transition-colors hover:bg-stone-50 sm:py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Where to?
        </div>
        <input
          type="text"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Destination or region…"
          autoComplete="off"
          className="mt-0.5 block w-full bg-transparent text-sm text-ink placeholder-stone-400 focus:outline-none"
        />
      </label>

      {/* ── Dropdown ── */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* ── Mobile: simple region list ── */}
          <div
            className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:hidden"
          >
            <p className="border-b border-stone-100 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Browse destinations
            </p>
            {DESTINATIONS.map((col) => (
              <button
                key={col.label}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(col.label); }}
                className="flex w-full items-center justify-between border-b border-stone-100 px-5 py-4 text-left last:border-0 hover:bg-stone-50"
              >
                <span className="text-[15px] font-medium text-stone-800">
                  {col.label}
                </span>
                <span className="text-stone-300 text-sm">→</span>
              </button>
            ))}
          </div>

          {/* ── Desktop: 6-column grid ── */}
          <div
            className="absolute left-0 top-full z-50 mt-2 hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.12)] sm:block"
            style={{ width: "min(900px, calc(100vw - 1.5rem))" }}
          >
            <div className="grid grid-cols-6">
              {DESTINATIONS.map((col, i) => (
                <div
                  key={col.label}
                  className={`flex flex-col px-6 py-6 ${
                    i < DESTINATIONS.length - 1 ? "border-r border-stone-100" : ""
                  }`}
                >
                  <p className="mb-4 text-[15px] font-semibold text-stone-900">
                    {col.label}
                  </p>
                  <ul className="flex-1 space-y-2">
                    {col.places.map((place) => (
                      <li key={place}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); pick(place); }}
                          className="block w-full text-left text-[14px] text-stone-600 transition-colors hover:text-amber-700"
                        >
                          {place}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pick(col.label); }}
                    className="mt-5 block text-left text-[13px] text-stone-400 transition-colors hover:text-stone-600"
                  >
                    All trips in {col.label} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
