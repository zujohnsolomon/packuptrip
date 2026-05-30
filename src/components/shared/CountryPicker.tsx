"use client";

import { useMemo, useState } from "react";
import { COUNTRIES } from "@/lib/countries";

/* Multi-select country picker with search.
 * Used in ProfileEditor so hosts can mark countries they've visited.
 * The result is an alpha-3 string[] saved to profiles.countries_visited. */

export function CountryPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [query]);

  function toggle(code: string) {
    if (selectedSet.has(code)) {
      onChange(selected.filter((c) => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  return (
    <div>
      {/* Selected count + clear */}
      <div className="mb-2 flex items-baseline justify-between text-[11px]">
        <span className="text-stone-500">
          <span className="font-semibold text-ink">{selected.length}</span>{" "}
          {selected.length === 1 ? "country" : "countries"} selected
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-stone-500 underline-offset-2 hover:text-ink hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((code) => {
            const c = COUNTRIES.find((c) => c.code === code);
            if (!c) return null;
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-100 hover:bg-green-100"
              >
                {c.name}
                <span aria-hidden className="text-green-700">×</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search countries…"
        className="mb-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-[13px] text-ink placeholder:text-stone-400 focus:border-[#2d5130] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d5130]/15"
      />

      {/* Country list */}
      <div className="max-h-44 overflow-y-auto rounded-lg border border-stone-200 bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-stone-400">
            No countries match &ldquo;{query}&rdquo;
          </p>
        ) : (
          <ul>
            {filtered.map((c) => {
              const isSelected = selectedSet.has(c.code);
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => toggle(c.code)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors ${
                      isSelected
                        ? "bg-green-50 text-green-800"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span>{c.name}</span>
                    {isSelected && <span className="text-green-700">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
