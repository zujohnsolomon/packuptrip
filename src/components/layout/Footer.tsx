import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-stone-300">
      {/* ── Editorial closing ── */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            · A note from the makers ·
          </p>
          <h2
            className="mt-5 font-serif font-medium leading-[1.05] tracking-tight text-white"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontVariationSettings: "'opsz' 144",
            }}
          >
            Travel together, never alone.
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif text-lg italic leading-relaxed text-stone-400">
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
          <span className="font-serif italic">
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
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-stone-300 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
