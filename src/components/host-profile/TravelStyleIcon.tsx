/** Line-art travel style icons — one distinct glyph per tag (mockup style). */

import type { ReactNode } from "react";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden className="text-[#1a1614]">
      {children}
    </svg>
  );
}

function Adventure() {
  return (
    <IconWrap>
      <path {...stroke} d="M4 20L8.5 8l3.5 7 2.5-4.5L17 20H4z" />
      <path {...stroke} d="M14 8l2-4 2 4" />
    </IconWrap>
  );
}

function Culture() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 3v4M8 7h8" />
      <path {...stroke} d="M6 21V11l6-4 6 4v10" />
      <path {...stroke} d="M9 21v-6h6v6" />
    </IconWrap>
  );
}

function Food() {
  return (
    <IconWrap>
      <path {...stroke} d="M6 3v8a2 2 0 004 0V3M8 3v18" />
      <path {...stroke} d="M17 3v7c0 1.7-1.3 3-3 3h-1v7" />
    </IconWrap>
  );
}

function Photography() {
  return (
    <IconWrap>
      <path {...stroke} d="M4 8h2l2-3h8l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V10a2 2 0 012-2z" />
      <circle {...stroke} cx="12" cy="13" r="3.5" />
    </IconWrap>
  );
}

function Nature() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 4c-2 4-6 5-6 11a6 6 0 1012 0c0-6-4-7-6-11z" />
      <path {...stroke} d="M12 20v-3" />
    </IconWrap>
  );
}

function Budget() {
  return (
    <IconWrap>
      <rect {...stroke} x="3" y="6" width="18" height="14" rx="2" />
      <path {...stroke} d="M3 10h18M8 14h2M14 14h2" />
    </IconWrap>
  );
}

function Backpacking() {
  return (
    <IconWrap>
      <path {...stroke} d="M8 6h8v14H8z" />
      <path {...stroke} d="M10 6V4a2 2 0 014 0v2M12 10v6" />
      <path {...stroke} d="M6 12h2M16 12h2" />
    </IconWrap>
  );
}

function RoadTrip() {
  return (
    <IconWrap>
      <path {...stroke} d="M5 17h14l-1.5-5.5a2 2 0 00-1.9-1.5H8.4a2 2 0 00-1.9 1.5L5 17z" />
      <circle {...stroke} cx="8" cy="17" r="1.5" />
      <circle {...stroke} cx="16" cy="17" r="1.5" />
      <path {...stroke} d="M5 11h14" />
    </IconWrap>
  );
}

function Beach() {
  return (
    <IconWrap>
      <path {...stroke} d="M4 18h16" />
      <path {...stroke} d="M6 18c2-4 4-6 6-6s4 2 6 6" />
      <circle {...stroke} cx="17" cy="7" r="2.5" />
      <path {...stroke} d="M3 18c1-2 2.5-3 4-3" />
    </IconWrap>
  );
}

function Luxury() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.8 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
    </IconWrap>
  );
}

function Community() {
  return (
    <IconWrap>
      <circle {...stroke} cx="9" cy="8" r="2.5" />
      <circle {...stroke} cx="16" cy="9" r="2" />
      <path {...stroke} d="M4 20v-1a4 4 0 014-4h2a4 4 0 014 0v1M14 20v-1a3 3 0 013-3h1" />
    </IconWrap>
  );
}

function Local() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 21s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10z" />
      <circle {...stroke} cx="12" cy="11" r="2" />
    </IconWrap>
  );
}

function Nightlife() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 3a7 7 0 107 7 9 9 0 01-7-7z" />
    </IconWrap>
  );
}

function Wellness() {
  return (
    <IconWrap>
      <path {...stroke} d="M12 5c-3 3-5 6-5 9a5 5 0 0010 0c0-3-2-6-5-9z" />
    </IconWrap>
  );
}

function Default() {
  return (
    <IconWrap>
      <circle {...stroke} cx="12" cy="12" r="8" />
      <path {...stroke} d="M12 8v4l2 2" />
    </IconWrap>
  );
}

export function TravelStyleIcon({ tag }: { tag: string }) {
  const key = tag.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  if (key.includes("adventure") || key.includes("hiking") || key.includes("trek")) return <Adventure />;
  if (key.includes("culture") || key.includes("history") || key.includes("heritage")) return <Culture />;
  if (key.includes("food") || key.includes("culinary") || key.includes("dining")) return <Food />;
  if (key.includes("photo")) return <Photography />;
  if (key.includes("nature") || key.includes("wildlife") || key.includes("eco")) return <Nature />;
  if (key.includes("backpack")) return <Backpacking />;
  if (key.includes("budget")) return <Budget />;
  if (key.includes("road")) return <RoadTrip />;
  if (key.includes("beach") || key.includes("island") || key.includes("coast")) return <Beach />;
  if (key.includes("luxury") || key.includes("premium")) return <Luxury />;
  if (key.includes("community") || key.includes("social")) return <Community />;
  if (key.includes("local") || key.includes("hidden") || key.includes("gem")) return <Local />;
  if (key.includes("wellness") || key.includes("yoga")) return <Wellness />;
  if (key.includes("night")) return <Nightlife />;
  if (key.includes("solo")) return <Community />;

  return <Default />;
}
