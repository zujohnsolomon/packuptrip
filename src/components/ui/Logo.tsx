import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  size = 36,
  light = false,
}: {
  size?: number;
  light?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className={cn(
          "grid place-items-center rounded-xl shadow-sm transition-transform group-hover:scale-105",
          light ? "bg-white/15 ring-1 ring-white/30 text-stone-900 backdrop-blur" : "bg-yellow-400 text-stone-900",
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <CompassIcon size={Math.round(size * 0.58)} />
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight transition-colors",
          light ? "text-white" : "text-ink",
        )}
      >
        Packuptrip
      </span>
    </Link>
  );
}

function CompassIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
