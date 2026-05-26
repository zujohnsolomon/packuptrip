"use client";

import { useState, useRef, useEffect } from "react";

type Place = { name: string; hint: string };
type Region = {
  region: string;
  dot: string;   // tailwind bg colour for the dot
  accent?: boolean;
  places: Place[];
};

const DESTINATIONS: Region[] = [
  {
    region: "South India",
    dot: "bg-amber-500",
    accent: true,
    places: [
      { name: "Tamil Nadu",   hint: "Ooty · Kodaikanal · Madurai" },
      { name: "Kerala",       hint: "Munnar · Wayanad · Alleppey" },
      { name: "Karnataka",    hint: "Coorg · Hampi · Kabini" },
      { name: "Goa",          hint: "Beaches · Old Goa · Dudhsagar" },
      { name: "Pondicherry",  hint: "French Quarter · Auroville" },
    ],
  },
  {
    region: "Himalayas",
    dot: "bg-sky-500",
    places: [
      { name: "Ladakh",            hint: "Leh · Nubra · Pangong" },
      { name: "Spiti Valley",      hint: "Kaza · Key · Pin Valley" },
      { name: "Manali",            hint: "Solang · Kasol · Kheerganga" },
      { name: "Uttarakhand",       hint: "Rishikesh · Chopta · Kedarnath" },
      { name: "Himachal Pradesh",  hint: "Dharamshala · Tirthan · Sangla" },
    ],
  },
  {
    region: "Northeast",
    dot: "bg-teal-500",
    places: [
      { name: "Meghalaya",         hint: "Shillong · Dawki · Cherrapunji" },
      { name: "Sikkim",            hint: "Gangtok · Gurudongmar · Yumthang" },
      { name: "Arunachal Pradesh", hint: "Tawang · Ziro · Mechuka" },
      { name: "Assam",             hint: "Kaziranga · Majuli · Brahmaputra" },
      { name: "Nagaland",          hint: "Hornbill Festival · Dzukou" },
    ],
  },
  {
    region: "Coastal & Islands",
    dot: "bg-blue-500",
    places: [
      { name: "Andaman",       hint: "Havelock · Neil · Baratang" },
      { name: "Kerala Coast",  hint: "Kovalam · Varkala · Bekal" },
      { name: "Lakshadweep",   hint: "Agatti · Bangaram · Minicoy" },
      { name: "Konkan Coast",  hint: "Tarkarli · Malvan · Ganapatipule" },
      { name: "Odisha Coast",  hint: "Puri · Chilika Lake · Gopalpur" },
    ],
  },
  {
    region: "Heritage",
    dot: "bg-orange-500",
    places: [
      { name: "Rajasthan",      hint: "Jaisalmer · Udaipur · Jaipur" },
      { name: "Madhya Pradesh", hint: "Orchha · Khajuraho · Pachmarhi" },
      { name: "Gujarat",        hint: "Rann of Kutch · Gir · Dwarka" },
      { name: "Varanasi",       hint: "Ghats · Temples · Sarnath" },
      { name: "Hampi",          hint: "Ruins · Boulders · Tungabhadra" },
    ],
  },
  {
    region: "Wildlife",
    dot: "bg-green-600",
    places: [
      { name: "Jim Corbett",  hint: "Tigers · Elephants · Ramganga" },
      { name: "Ranthambore",  hint: "Tiger Reserve · Sawai Madhopur" },
      { name: "Kabini",       hint: "Nagarhole · Elephants · River Safari" },
      { name: "Tadoba",       hint: "Maharashtra · Dense Forest" },
      { name: "Bandhavgarh",  hint: "MP · High Tiger Density" },
    ],
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

      {/* ── Field ── */}
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

          <div
            className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-stone-150 bg-white shadow-[0_12px_48px_-8px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
            style={{ width: "min(860px, calc(100vw - 1.5rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-100">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                Browse destinations
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-stone-300 transition hover:bg-stone-100 hover:text-stone-500"
                aria-label="Close"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* 6-column grid */}
            <div className="grid grid-cols-2 divide-x divide-stone-100 sm:grid-cols-3 lg:grid-cols-6">
              {DESTINATIONS.map((col) => (
                <div key={col.region} className="px-4 py-5">

                  {/* Region label */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${col.dot}`} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
                      {col.region}
                    </span>
                    {col.accent && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-amber-700">
                        Popular
                      </span>
                    )}
                  </div>

                  {/* Places list */}
                  <ul className="space-y-0.5">
                    {col.places.map((p) => (
                      <li key={p.name}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); pick(p.name); }}
                          className={`group w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                            col.accent ? "hover:bg-amber-50" : "hover:bg-stone-50"
                          }`}
                        >
                          <span className={`block text-[13px] font-medium leading-tight ${
                            col.accent
                              ? "text-stone-800 group-hover:text-amber-800"
                              : "text-stone-700 group-hover:text-stone-900"
                          }`}>
                            {p.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-tight text-stone-400">
                            {p.hint}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 px-6 py-3 text-[11px] text-stone-400">
              Can&apos;t find it? Type any destination above and hit Search.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
