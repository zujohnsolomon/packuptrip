import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicContact } from "./types";
import { hasSocialLinks, friendlyDomain } from "./utils";
import {
  ArrowUpRightIcon,
  ChatIcon,
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  PhoneIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

function SocialIcon({
  href,
  label,
  bg,
  children,
}: {
  href: string;
  label: string;
  bg: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full text-white shadow-sm transition hover:opacity-85 ${bg}`}
    >
      {children}
    </a>
  );
}

type SocialLinksGridProps = {
  publicContact: PublicContact | null;
  hostId: string;
  firstName: string;
};

export function SocialLinksGrid({
  publicContact,
  hostId,
  firstName,
}: SocialLinksGridProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-[0_8px_24px_rgba(64,44,26,0.06)]">
      <h3 className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
        Let&apos;s connect
      </h3>
      <p className="mb-4 text-[12px] text-stone-500">
        {hasSocialLinks(publicContact)
          ? "Follow or message me on"
          : `Message ${firstName} through Packuptrip.`}
      </p>

      {hasSocialLinks(publicContact) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {publicContact?.instagram && (
            <SocialIcon
              href={`https://instagram.com/${publicContact.instagram}`}
              label="Instagram"
              bg="bg-[#E1306C]"
            >
              <InstagramIcon />
            </SocialIcon>
          )}
          {publicContact?.facebook && (
            <SocialIcon href={publicContact.facebook} label="Facebook" bg="bg-[#1877f2]">
              <FacebookIcon />
            </SocialIcon>
          )}
          {publicContact?.youtube && (
            <SocialIcon href={publicContact.youtube} label="YouTube" bg="bg-[#ff0000]">
              <YouTubeIcon />
            </SocialIcon>
          )}
          {publicContact?.linkedin && (
            <SocialIcon href={publicContact.linkedin} label="LinkedIn" bg="bg-[#0a66c2]">
              <LinkedInIcon />
            </SocialIcon>
          )}
          {publicContact?.twitter && (
            <SocialIcon
              href={`https://x.com/${publicContact.twitter}`}
              label="X / Twitter"
              bg="bg-[#000000]"
            >
              <XIcon />
            </SocialIcon>
          )}
          {publicContact?.whatsapp && (
            <SocialIcon
              href={`https://wa.me/${publicContact.whatsapp}`}
              label="WhatsApp"
              bg="bg-[#25d366]"
            >
              <WhatsAppIcon />
            </SocialIcon>
          )}
        </div>
      )}

      <Link
        href={`/messages?hostId=${hostId}`}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#17120f] text-[13px] font-bold text-white transition hover:bg-stone-800"
      >
        <ChatIcon size={15} />
        Message on Packuptrip
      </Link>

      {publicContact?.phone && (
        <a
          href={`tel:${publicContact.phone.replace(/\s+/g, "")}`}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 text-[13px] font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          <PhoneIcon size={14} />
          {publicContact.phone}
        </a>
      )}
      {publicContact?.website && (
        <a
          href={publicContact.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-stone-200 text-[13px] font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          <GlobeIcon size={14} />
          {friendlyDomain(publicContact.website)}
          <ArrowUpRightIcon />
        </a>
      )}
    </div>
  );
}
