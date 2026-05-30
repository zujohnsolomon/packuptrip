import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const AMBER = "#b45309";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#f4ede1] text-[#2b2520]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-24">
          {/* ── Editorial masthead ── */}
          <div>
            <span
              className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em]"
              style={{ color: AMBER }}
            >
              <span className="h-px w-7" style={{ backgroundColor: `${AMBER}55` }} />
              A note from the makers
            </span>

            <h2
              className="mt-6 font-serif font-medium leading-[0.98] tracking-tight text-[#211c1a]"
              style={{
                fontSize: "clamp(2.5rem, 4.6vw, 3.75rem)",
                fontVariationSettings: "'opsz' 144",
              }}
            >
              Go far,
              <span className="block italic" style={{ color: AMBER }}>
                go together.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-[15px] leading-[1.75] text-stone-600">
              Curated journeys and community trips — hand-picked, hand-led,
              and run by people who&rsquo;d rather know your name than your
              postcode.
            </p>
          </div>

          {/* ── Navigation columns ── */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:pt-3">
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
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#e3d8c6]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-xs text-stone-500">
              © {year} Packuptrip
            </span>
          </div>
          <span className="font-serif text-sm italic text-stone-500">
            Made by hand in Thalavadi · powered by chai and a little wanderlust
          </span>
        </div>
      </div>
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
    <div>
      <div
        className="text-[11px] font-bold uppercase tracking-[0.18em]"
        style={{ color: AMBER }}
      >
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-stone-600 transition-colors hover:text-[#211c1a]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
