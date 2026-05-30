import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const GOLD = "#e3a857";

export function Footer() {
  return (
    <footer className="bg-ink text-stone-300">
      {/* ── Editorial closing ── */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <span
            className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em]"
            style={{ color: GOLD }}
          >
            <span className="h-px w-7" style={{ backgroundColor: `${GOLD}66` }} />
            A note from the makers
            <span className="h-px w-7" style={{ backgroundColor: `${GOLD}66` }} />
          </span>

          <h2
            className="mt-7 font-serif font-medium leading-[1.0] tracking-tight text-stone-50"
            style={{
              fontSize: "clamp(2.4rem, 5.5vw, 4.25rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Travel together,
            <span className="block italic" style={{ color: GOLD }}>
              never alone.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-md text-[15px] leading-[1.75] text-stone-400">
            Curated journeys and community trips — hand-picked, hand-led,
            and run by people who&rsquo;d rather know your name than your
            postcode.
          </p>
        </div>
      </section>

      {/* ── Links ── */}
      <section>
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8">
          {/* Logo column */}
          <div className="lg:col-span-3">
            <Logo light />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-stone-400">
              A small studio building a better way to travel together.
              Based in Chennai. On the road, most weeks.
            </p>
          </div>

          {/* Link groups */}
          <FooterColumn
            title="Find a trip"
            links={[
              { href: "/packages", label: "Packages" },
              { href: "/trips", label: "Community trips" },
              { href: "/host", label: "Host a trip" },
              { href: "/plus", label: "✦ Plus" },
            ]}
          />
          <FooterColumn
            title="The Journal"
            links={[
              { href: "/stories", label: "Stories" },
              { href: "/hosts", label: "Hosts" },
            ]}
          />
          <FooterColumn
            title="House"
            links={[
              { href: "/about", label: "About" },
              { href: "/trust", label: "Trust & safety" },
              { href: "/contact", label: "Get in touch" },
            ]}
          />
          <FooterColumn
            title="Fine print"
            links={[
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
              { href: "/refunds", label: "Refunds" },
            ]}
          />
        </div>
      </section>

      {/* ── Bottom bar ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Packuptrip</span>
          <span className="font-serif italic text-stone-400">
            Made by humans in Chennai · with chai and a few too many maps
          </span>
        </div>
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="lg:col-span-2">
      <div
        className="text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: GOLD }}
      >
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-stone-200 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
