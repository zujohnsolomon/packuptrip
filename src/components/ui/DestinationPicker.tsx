"use client";

import { useState, useRef, useEffect } from "react";

type Place = { name: string; hint: string };
type Region = {
  region: string;
  emoji: string;
  accent?: boolean;
  places: Place[];
};

const DESTINATIONS: Region[] = [
  /* ── South India first — always ───────────────────────────────────────── */
  {
    region: "South India",
    emoji: "🌴",
    accent: true,
    places: [
      { name: "Tamil Nadu",   hint: "Ooty · Kodaikanal · Madurai" },
      { name: "Kerala",       hint: "Munnar · Wayanad · Alleppey" },
      { name: "Karnataka",    hint: "Coorg · Hampi · Kabini" },
      { name: "Goa",          hint: "Beaches · Old Goa · Dudhsagar" },
      { name: "Pondicherry",  hint: "French Quarter · Auroville" },
    ],
  },
  /* ── Other regions ─────────────────────────────────────────────────────── */
  {
    region: "Himalayas",
    emoji: "🏔️",
    places: [
      { name: "Ladakh",           hint: "Leh · Nubra · Pangong" },
      { name: "Spiti Valley",     hint: "Kaza · Key · Pin Valley" },
      { name: "Manali",           hint: "Solang · Kasol · Kheerganga" },
      { name: "Uttarakhand",      hint: "Rishikesh · Chopta · Valley of Flowers" },
      { name: "Himachal Pradesh", hint: "Dharamshala · Tirthan · Sangla" },
    ],
  },
  {
    region: "Northeast",
    emoji: "🌿",
    places: [
      { name: "Meghalaya",        hint: "Shillong · Dawki · Cherrapunji" },
      { name: "Sikkim",           hint: "Gangtok · Gurudongmar · Yumthang" },
      { name: "Arunachal Pradesh",hint: "Tawang · Ziro · Mechuka" },
      { name: "Assam",            hint: "Kaziranga · Majuli · Brahmaputra" },
      { name: "Nagaland",         hint: "Hornbill Festival · Dzukou" },
    ],
  },
  {
    region: "Coastal & Islands",
    emoji: "🌊",
    places: [
      { name: "Andaman",      hint: "Havelock · Neil · Baratang" },
      { name: "Kerala Coast", hint: "Kovalam · Varkala · Bekal" },
      { name: "Lakshadweep",  hint: "Agatti · Bangaram · Minicoy" },
      { name: "Konkan Coast", hint: "Tarkarli · Malvan · Ganapatipule" },
      { name: "Odisha Coast", hint: "Puri · Chilika Lake · Gopalpur" },
    ],
  },
  {
    region: "Heritage",
    emoji: "🏰",
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
    emoji: "🐯",
    places: [
      { name: "Jim Corbett",   hint: "Tigers · Elephants · Ramganga" },
      { name: "Ranthambore",   hint: "Tiger Reserve · Sawai Madhopur" },
      { name: "Kabini",        hint: "Nagarhole · Elephants · River Safari" },
      { name: "Tadoba",        hint: "Maharashtra · Dense Forest" },
      { name: "Bandhavgarh",   hint: "MP · High Tiger Density" },
    ],
  },
];

export function DestinationPicker({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on click outside */
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
          {/* Backdrop — captures outside clicks on mobile without scroll issues */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            className="absolute left-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-[0_8px_48px_rgba(0,0,0,0.14)]"
            style={{ width: "min(760px, calc(100vw - 2rem))" }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Browse destinations
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-stone-300 hover:text-stone-500 transition-colors"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-px bg-stone-100 sm:grid-cols-3 lg:grid-cols-6">
              {DESTINATIONS.map((col) => (
                <div
                  key={col.region}
                  className={`p-4 ${col.accent ? "bg-amber-50" : "bg-white"}`}
                >
                  {/* Region header */}
                  <div className={`mb-3 flex items-center gap-1.5 ${col.accent ? "text-amber-700" : "text-stone-400"}`}>
                    <span className="text-sm leading-none">{col.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                      {col.region}
                    </span>
                    {col.accent && (
                      <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold leading-none text-amber-800">
                        ★ Popular
                      </span>
                    )}
                  </div>

                  {/* Places */}
                  <ul className="space-y-0.5">
                    {col.places.map((p) => (
                      <li key={p.name}>
                        <button
                          type="button"
                          /* onMouseDown prevents blur from closing the dropdown
                             before the click registers */
                          onMouseDown={(e) => { e.preventDefault(); pick(p.name); }}
                          className="group w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white"
                        >
                          <span className={`block text-sm font-medium leading-snug ${
                            col.accent
                              ? "text-amber-900 group-hover:text-amber-700"
                              : "text-stone-700 group-hover:text-amber-700"
                          }`}>
                            {p.name}
                          </span>
                          <span className="block text-[10px] leading-snug text-stone-400">
                            {p.hint}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="border-t border-stone-100 px-5 py-3 text-[11px] text-stone-400">
              Can&apos;t find your destination? Just type it above and search.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
