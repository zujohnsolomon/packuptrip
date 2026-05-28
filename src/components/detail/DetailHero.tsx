import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { HeroCarousel } from "./HeroCarousel";

export function DetailHero({
  images,
  title,
  location,
  variant,
  backHref,
  backLabel,
}: {
  images: string[];
  title: string;
  location: string;
  variant: "originals" | "community";
  backHref: string;
  backLabel: string;
}) {
  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="relative h-[55vh] min-h-[380px] w-full bg-stone-200">
        <HeroCarousel images={images} title={title} />
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
          >
            <ArrowLeft /> {backLabel}
          </Link>
          <div className="mt-3">
            <Badge variant={variant}>
              {variant === "originals" ? "Packuptrip Original" : "Community trip"}
            </Badge>
          </div>
          <h1
            className="mt-3 max-w-3xl font-serif font-medium leading-[1.05] tracking-tight text-white"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            {title}
          </h1>
          <p className="mt-2 font-serif text-base italic text-white/85 sm:text-lg">
            {location}
          </p>
        </div>
      </div>
    </section>
  );
}

function ArrowLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
