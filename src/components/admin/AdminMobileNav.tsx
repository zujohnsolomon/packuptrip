"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/** Horizontal-scroll nav for mobile/tablet (sidebar hides below lg). */
const items = [
  { href: "/admin/overview",       label: "Overview" },
  { href: "/admin/approvals",      label: "Approvals" },
  { href: "/admin/originals",      label: "Originals" },
  { href: "/admin/trips",          label: "Trips" },
  { href: "/admin/users",          label: "Users" },
  { href: "/admin/hosts",          label: "Hosts" },
  { href: "/admin/bookings",       label: "Bookings" },
  { href: "/admin/reports",        label: "Reports" },
  { href: "/admin/verifications",  label: "Verifications" },
  { href: "/admin/reviews",        label: "Reviews" },
  { href: "/admin/settings",       label: "Settings" },
];

export function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo size={28} />
        <Link
          href="/"
          className="text-xs font-medium text-stone-500 hover:text-ink"
        >
          View site →
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-stone-100 px-2 pb-2 pt-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-yellow-50 text-yellow-400"
                  : "text-stone-600 hover:bg-stone-50 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
