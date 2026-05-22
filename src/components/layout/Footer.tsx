import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-stone-200/70 bg-stone-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-stone-600">
            Travel together, never alone. Curated journeys and community trips,
            in one warm place.
          </p>
        </div>
        <FooterColumn
          title="Explore"
          links={[
            { href: "/packages", label: "Packages" },
            { href: "/trips", label: "Community trips" },
            { href: "/host", label: "Host a trip" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: "/about", label: "About" },
            { href: "/trust", label: "Trust & safety" },
            { href: "/contact", label: "Contact" },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/refunds", label: "Refunds" },
          ]}
        />
      </div>
      <div className="border-t border-stone-200/70">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-stone-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Packuptrip. Made with care in India.
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
      <div className="text-sm font-semibold text-ink">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-stone-600">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-ink transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
