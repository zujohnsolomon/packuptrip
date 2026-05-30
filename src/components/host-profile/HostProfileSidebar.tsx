"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Profile, Trip } from "@/types/db";
import type { PublicContact } from "./types";
import { hasSocialLinks, friendlyDomain } from "./utils";
import {
  ChatIcon,
  ClockIcon,
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  PaperPlaneIcon,
  ShareIcon,
  UserIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";
import { BookTripModal } from "./BookTripModal";

function FactRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-[13px]">
      <span className="shrink-0 text-stone-400">{icon}</span>
      <span className="text-stone-500">{label}:</span>
      <span className="font-bold text-[#17120f]">{value}</span>
    </div>
  );
}

function SocialBtn({
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
      className={`grid h-9 w-9 place-items-center rounded-full text-white shadow-sm ${bg}`}
    >
      {children}
    </a>
  );
}

type HostProfileSidebarProps = {
  profile: Profile;
  hostId: string;
  isOwnProfile: boolean;
  publicContact: PublicContact | null;
  galleryImages: string[];
  pullQuote: string;
  trips?: Trip[];
};

export function HostProfileActions({
  hostId,
  isOwnProfile,
  trips = [],
  hostName = "Host",
}: {
  hostId: string;
  isOwnProfile: boolean;
  trips?: Trip[];
  hostName?: string;
}) {
  const [bookModalOpen, setBookModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {isOwnProfile ? (
          <Link
            href="/account/profile"
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2d5130] text-[13px] font-bold text-white hover:bg-[#244329]"
          >
            Edit profile
          </Link>
        ) : (
          <>
            <Link
              href={`/messages?hostId=${hostId}`}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2d5130] text-[13px] font-bold text-white hover:bg-[#244329]"
            >
              <PaperPlaneIcon size={14} />
              Connect
            </Link>
            <button
              type="button"
              onClick={() => setBookModalOpen(true)}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-stone-200 bg-white text-[13px] font-bold text-stone-700 hover:bg-stone-50"
            >
              Book a trip
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: `${hostName}'s profile`, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert("Profile link copied!");
                }
              }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              aria-label="Share"
            >
              <ShareIcon size={16} />
            </button>
          </>
        )}
      </div>
      <BookTripModal
        trips={trips}
        hostName={hostName}
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
      />
    </>
  );
}

export function HostProfileSidebar({
  profile,
  hostId,
  isOwnProfile,
  publicContact,
  galleryImages,
  pullQuote,
  trips = [],
}: HostProfileSidebarProps) {
  const memberMonth = new Date(profile.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const moments = galleryImages.slice(0, 6);

  return (
    <aside className="space-y-5 lg:sticky lg:top-[72px] lg:self-start">
      {/* Mobile-only actions */}
      <div className="lg:hidden">
        <HostProfileActions hostId={hostId} isOwnProfile={isOwnProfile} trips={trips} hostName={profile.name} />
      </div>

      {/* Quote + facts card */}
      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-[#f3f1ec] p-6">
        <span
          aria-hidden
          className="font-serif text-[64px] leading-none text-stone-300"
        >
          &ldquo;
        </span>
        <blockquote className="-mt-6 font-serif text-[1.2rem] font-medium italic leading-snug text-[#17120f]">
          {pullQuote}
        </blockquote>

        {/* Stamp */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-stone-300/80 opacity-50"
        >
          <span className="text-center text-[9px] font-bold uppercase leading-tight tracking-wider text-stone-400">
            Pack
            <br />
            up
            <br />
            trip
          </span>
        </div>

        <div className="relative z-10 mt-6 space-y-3.5 border-t border-stone-200/80 pt-5">
          {profile.home_city && (
            <FactRow icon={<GlobeIcon size={15} />} label="From" value={profile.home_city} />
          )}
          {profile.languages.length > 0 && (
            <FactRow
              icon={<ChatIcon size={15} />}
              label="Languages"
              value={profile.languages.join(", ")}
            />
          )}
          <FactRow icon={<UserIcon size={15} />} label="Member since" value={memberMonth} />
          <FactRow icon={<ClockIcon size={15} />} label="Response rate" value="98%" />
          <FactRow icon={<ClockIcon size={15} />} label="Usually replies" value="within a few hours" />
        </div>
      </div>

      {/* Social */}
      <div id="stories" className="scroll-mt-28">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
          Let&apos;s connect
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {publicContact?.instagram && (
            <SocialBtn
              href={`https://instagram.com/${publicContact.instagram}`}
              label="Instagram"
              bg="bg-gradient-to-br from-[#f09433] to-[#bc1888]"
            >
              <InstagramIcon />
            </SocialBtn>
          )}
          {publicContact?.website && (
            <SocialBtn href={publicContact.website} label="Website" bg="bg-stone-700">
              <GlobeIcon size={16} />
            </SocialBtn>
          )}
          {publicContact?.youtube && (
            <SocialBtn href={publicContact.youtube} label="YouTube" bg="bg-red-600">
              <YouTubeIcon />
            </SocialBtn>
          )}
          {publicContact?.facebook && (
            <SocialBtn href={publicContact.facebook} label="Facebook" bg="bg-[#1877f2]">
              <FacebookIcon />
            </SocialBtn>
          )}
          {publicContact?.linkedin && (
            <SocialBtn href={publicContact.linkedin} label="LinkedIn" bg="bg-[#0a66c2]">
              <LinkedInIcon />
            </SocialBtn>
          )}
          {publicContact?.twitter && (
            <SocialBtn href={`https://x.com/${publicContact.twitter}`} label="X" bg="bg-black">
              <XIcon />
            </SocialBtn>
          )}
          {publicContact?.whatsapp && (
            <SocialBtn href={`https://wa.me/${publicContact.whatsapp}`} label="WhatsApp" bg="bg-[#25d366]">
              <WhatsAppIcon />
            </SocialBtn>
          )}
          {!hasSocialLinks(publicContact) && (
            <Link
              href={`/messages?hostId=${hostId}`}
              className="text-[13px] font-semibold text-stone-600 hover:text-[#17120f]"
            >
              Message on Packuptrip &rsaquo;
            </Link>
          )}
        </div>
        {publicContact?.website && (
          <p className="mt-2 text-[11px] text-stone-400">{friendlyDomain(publicContact.website)}</p>
        )}
      </div>

      {/* Moments grid — anchor always present for tab navigation */}
      {moments.length > 0 ? (
        <div id="gallery" className="scroll-mt-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">
            Moments from the road
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {moments.map((img, i) => (
              <div
                key={`${img}-${i}`}
                className="relative aspect-square overflow-hidden rounded-lg bg-stone-100"
              >
                <Image src={img} alt="" fill unoptimized sizes="100px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id="gallery" className="scroll-mt-28" aria-hidden />
      )}
    </aside>
  );
}
