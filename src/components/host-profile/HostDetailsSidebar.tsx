import type { ReactNode } from "react";
import type { Profile } from "@/types/db";
import {
  ChatIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
} from "./icons";

function GlanceRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-stone-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-stone-400">{label}</p>
        <p className={`text-[13px] font-bold leading-tight ${accent ? "text-[#2d5130]" : "text-[#1f1b17]"}`}>
          {value}
          {accent && value === "Verified" && (
            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2d5130] text-white">
              <CheckIcon size={9} />
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

type HostDetailsSidebarProps = {
  profile: Profile;
  totalHosted: number;
  quote?: string | null;
};

export function HostDetailsSidebar({
  profile,
  totalHosted,
  quote,
}: HostDetailsSidebarProps) {
  const memberMonth = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const pullQuote =
    quote ??
    "The best journeys answer questions that in the beginning you didn't even think to ask.";

  return (
    <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
      {/* CTA buttons */}
      <div className="hidden rounded-xl border border-stone-200 bg-white p-4 shadow-sm lg:block">
        <div className="flex gap-2">
          <a
            href={`/messages?hostId=${profile.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#17120f] text-[13px] font-bold text-white transition hover:bg-stone-800"
          >
            Connect
          </a>
          <a
            href={`/messages?hostId=${profile.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-stone-200 text-[13px] font-bold text-stone-700 transition hover:bg-stone-50"
          >
            Message
          </a>
        </div>
      </div>

      {/* Host facts card with pull quote */}
      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-6 shadow-[0_8px_24px_rgba(64,44,26,0.06)]">
        <blockquote
          className="relative z-10 font-serif text-[1.35rem] font-medium italic leading-snug text-[#17120f]"
        >
          &ldquo;{pullQuote}&rdquo;
        </blockquote>

        {/* Decorative stamp */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full border border-stone-100 opacity-40"
        />

        <div className="relative z-10 mt-6 space-y-4 border-t border-stone-100 pt-6">
          {profile.home_city && (
            <GlanceRow icon={<GlobeIcon />} label="From" value={profile.home_city} />
          )}
          {profile.languages.length > 0 && (
            <GlanceRow
              icon={<ChatIcon />}
              label="Languages"
              value={profile.languages.join(", ")}
            />
          )}
          <GlanceRow icon={<UserIcon />} label="Member since" value={memberMonth} />
          <GlanceRow icon={<ClockIcon />} label="Response rate" value="98%" />
          <GlanceRow icon={<ClockIcon />} label="Usually replies" value="within a few hours" />
          <GlanceRow icon={<GlobeIcon />} label="Trips hosted" value={String(totalHosted)} />
          {profile.id_verified && (
            <GlanceRow icon={<ShieldCheckIcon />} label="Identity" value="Verified" accent />
          )}
          {profile.host_tier === "superhost" && (
            <GlanceRow icon={<StarIcon />} label="Status" value="Superhost" accent />
          )}
        </div>
      </div>
    </aside>
  );
}
