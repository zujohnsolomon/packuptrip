import type { Profile } from "@/types/db";
import { BadgeCheckIcon, MailIcon, ShieldCheckIcon, ShieldIcon, StarIcon } from "./icons";

type Badge = {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
};

type VerificationBadgesProps = {
  profile: Profile;
};

export function VerificationBadges({ profile }: VerificationBadgesProps) {
  const badges: Badge[] = [
    {
      label: "Identity verified",
      description: "Government ID checked",
      icon: <ShieldCheckIcon />,
      active: profile.id_verified,
    },
    {
      label: "Email verified",
      description: "Account email confirmed",
      icon: <MailIcon />,
      active: true,
    },
    {
      label: "Superhost",
      description: "Consistently great trips",
      icon: <StarIcon size={16} />,
      active: profile.host_tier === "superhost",
    },
    {
      label: "Response rate verified",
      description: "Replies within a few hours",
      icon: <BadgeCheckIcon />,
      active: true,
    },
    {
      label: "Safety & trust",
      description: "Packuptrip community standards",
      icon: <ShieldIcon size={16} />,
      active: true,
    },
  ];

  const activeBadges = badges.filter((b) => b.active);

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_8px_24px_rgba(64,44,26,0.06)]">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
        Safety & trust
      </h3>
      <ul className="mt-4 space-y-3">
        {activeBadges.map((badge) => (
          <li key={badge.label} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-[#2d5130]">{badge.icon}</span>
            <div>
              <p className="text-[13px] font-bold text-[#17120f]">{badge.label}</p>
              <p className="text-[11px] text-stone-500">{badge.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
