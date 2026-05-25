"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  taskId: string;
};

const navItems: NavItem[] = [
  {
    href: "/admin/overview",
    label: "Overview",
    icon: <OverviewIcon />,
    taskId: "T9.2",
  },
  {
    href: "/admin/approvals",
    label: "Trip approvals",
    icon: <ApprovalsIcon />,
    taskId: "T9.3",
  },
  {
    href: "/admin/originals",
    label: "Originals",
    icon: <OriginalsIcon />,
    taskId: "T9.4",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: <UsersIcon />,
    taskId: "T9.6",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: <BookingsIcon />,
    taskId: "T9.8",
  },
  {
    href: "/admin/reports",
    label: "Reports & safety",
    icon: <ReportsIcon />,
    taskId: "T9.9",
  },
  {
    href: "/admin/verifications",
    label: "Verifications",
    icon: <VerificationsIcon />,
    taskId: "T9.6b",
  },
];

const deferredItems: string[] = [
  "Community trips (T9.5)",
  "Hosts (T9.7)",
  "Payouts (T9.10)",
  "Reviews (T9.11)",
  "Settings (T9.12)",
];

export function AdminSidebar({
  userName,
  openReportsCount = 0,
  pendingVerificationsCount = 0,
}: {
  userName: string;
  openReportsCount?: number;
  pendingVerificationsCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
      <div className="border-b border-stone-200 px-5 py-5">
        <Logo />
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Admin
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
                    active
                      ? "bg-amber-50 text-amber-800 font-semibold"
                      : "text-stone-700 hover:bg-stone-50 hover:text-ink",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-amber-600"
                    />
                  )}
                  <span
                    className={cn(
                      "shrink-0 transition-colors",
                      active
                        ? "text-amber-700"
                        : "text-stone-400 group-hover:text-stone-600",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/reports" && openReportsCount > 0 && (
                    <span
                      aria-label={`${openReportsCount} unresolved reports`}
                      className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-[18px] text-white"
                    >
                      {openReportsCount}
                    </span>
                  )}
                  {item.href === "/admin/verifications" && pendingVerificationsCount > 0 && (
                    <span
                      aria-label={`${pendingVerificationsCount} pending verifications`}
                      className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold leading-[18px] text-white"
                    >
                      {pendingVerificationsCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Coming after launch
          </div>
          <ul className="mt-2 space-y-1.5">
            {deferredItems.map((label) => (
              <li
                key={label}
                className="text-xs text-stone-400 cursor-not-allowed"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-stone-200 px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-ink"
        >
          <ExternalIcon /> View live site
        </Link>
        <div className="mt-2 flex items-center justify-between rounded-lg px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-ink">
              {userName}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-amber-700">
              Admin
            </div>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-ink hover:underline"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

/* Icons - inline so we don't add a runtime dependency. All stroke-based for
 * tonal consistency. */

function OverviewIcon() {
  return (
    <Svg>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </Svg>
  );
}

function ApprovalsIcon() {
  return (
    <Svg>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Svg>
  );
}

function OriginalsIcon() {
  return (
    <Svg>
      <path d="M3 21l18-9-18-9v7l13 2-13 2z" />
    </Svg>
  );
}

function UsersIcon() {
  return (
    <Svg>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function BookingsIcon() {
  return (
    <Svg>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

function ReportsIcon() {
  return (
    <Svg>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  );
}

function VerificationsIcon() {
  return (
    <Svg>
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
      <polyline points="9 12 11 14 15 10" />
    </Svg>
  );
}

function ExternalIcon() {
  return (
    <Svg size={14}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </Svg>
  );
}

function Svg({
  size = 16,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
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
      aria-hidden
    >
      {children}
    </svg>
  );
}
