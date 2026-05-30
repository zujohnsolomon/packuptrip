"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/profile";
import { CountryPicker } from "@/components/shared/CountryPicker";
import { ImagesEditor } from "@/components/shared/ImagesEditor";
import { isReservedUsername } from "@/lib/reserved-usernames";
import type { Profile, HostContact } from "@/types/db";

const STYLE_TAGS = [
  "Adventure",
  "Culture",
  "Food",
  "Photography",
  "Nature",
  "Budget",
  "Luxury",
  "Offbeat",
  "Backpacking",
  "Road Trip",
  "Beach",
  "Mountains",
  "Spiritual",
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "French",
  "Spanish",
  "German",
  "Japanese",
  "Arabic",
];

const CROP_DISPLAY = 280;
const CROP_OUTPUT = 400;

type ContactDraft = {
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  website: string;
  phonePublic: boolean;
  whatsappPublic: boolean;
  emailPublic: boolean;
  instagramPublic: boolean;
  websitePublic: boolean;
  facebook: string;
  youtube: string;
  linkedin: string;
  twitter: string;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

type DraftProfile = {
  name: string;
  username: string;
  bio: string;
  homeCity: string;
  styleTags: string[];
  languages: string[];
  countriesVisited: string[];
  profileGallery: string[];
  contact: ContactDraft;
  avatarUrl: string | null;
};

export function ProfileEditor({
  profile,
  contact,
}: {
  profile: Profile;
  contact: HostContact | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftProfile>({
    name: profile.name ?? "",
    username: profile.username ?? "",
    bio: profile.bio ?? "",
    homeCity: profile.home_city ?? "",
    styleTags: profile.travel_style_tags ?? [],
    languages: profile.languages ?? [],
    countriesVisited: profile.countries_visited ?? [],
    profileGallery: profile.profile_gallery ?? [],
    contact: {
      phone: contact?.phone ?? "",
      whatsapp: contact?.whatsapp ?? "",
      email: contact?.email ?? "",
      instagram: contact?.instagram ?? "",
      website: contact?.website ?? "",
      phonePublic: contact?.phone_public ?? false,
      whatsappPublic: contact?.whatsapp_public ?? false,
      emailPublic: contact?.email_public ?? false,
      instagramPublic: contact?.instagram_public ?? true,
      websitePublic: contact?.website_public ?? true,
      facebook: contact?.facebook ?? "",
      youtube: contact?.youtube ?? "",
      linkedin: contact?.linkedin ?? "",
      twitter: contact?.twitter ?? "",
    },
    avatarUrl: profile.avatar_url,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "reserved">("idle");
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsername = useCallback(async (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) { setUsernameStatus("idle"); return; }
    if (!USERNAME_RE.test(trimmed)) { setUsernameStatus("invalid"); return; }
    if (isReservedUsername(trimmed)) { setUsernameStatus("reserved"); return; }
    if (trimmed === (profile.username ?? "")) { setUsernameStatus("available"); return; }
    setUsernameStatus("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .maybeSingle();
    setUsernameStatus(data ? "taken" : "available");
  }, [profile.username]);

  useEffect(() => {
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    usernameCheckRef.current = setTimeout(() => checkUsername(draft.username), 500);
    return () => { if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current); };
  }, [draft.username, checkUsername]);

  const publicProfileHref = draft.username.trim()
    ? `/${draft.username.trim().toLowerCase()}`
    : `/hosts/${profile.id}`;

  const canSave =
    !isPending &&
    usernameStatus !== "taken" &&
    usernameStatus !== "invalid" &&
    usernameStatus !== "reserved" &&
    usernameStatus !== "checking";
  const completion = useMemo(() => {
    const checks = [
      !!draft.name.trim(),
      !!draft.bio.trim(),
      !!draft.homeCity.trim(),
      draft.styleTags.length > 0,
      draft.languages.length > 0,
      draft.countriesVisited.length > 0,
      !!draft.avatarUrl,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  function updateDraft(patch: Partial<DraftProfile>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
  }

  function updateContact(patch: Partial<ContactDraft>) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, ...patch } }));
    setSaved(false);
  }

  function toggleValue(
    value: string,
    list: string[],
    key: "styleTags" | "languages",
    max?: number,
  ) {
    if (list.includes(value)) {
      updateDraft({ [key]: list.filter((item) => item !== value) });
      return;
    }
    if (max && list.length >= max) return;
    updateDraft({ [key]: [...list, value] });
  }

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const { error: err } = await updateProfile({
        name: draft.name,
        username: draft.username,
        bio: draft.bio,
        homeCity: draft.homeCity,
        travelStyleTags: draft.styleTags,
        languages: draft.languages,
        countriesVisited: draft.countriesVisited,
        profileGallery: draft.profileGallery,
        contact: draft.contact,
        avatarUrl: draft.avatarUrl,
      });
      if (err) {
        setError(err);
        return;
      }
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2800);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_272px] lg:items-start xl:grid-cols-[minmax(0,1fr)_288px]">
      <div className="space-y-2">
        <EditorCard
          eyebrow="Profile"
          title="Photo & identity"
          description="Avatar, name, city, bio."
          tight
        >
          <AvatarUploader
            userId={profile.id}
            current={draft.avatarUrl}
            name={draft.name || "Host"}
            onUploaded={(url) => updateDraft({ avatarUrl: url })}
          />

          <div className="border-t border-stone-100 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display name">
              <input
                type="text"
                value={draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                maxLength={60}
                placeholder="John Solomon"
                className={inputClassName}
              />
            </Field>

            <Field label="Home city">
              <input
                type="text"
                value={draft.homeCity}
                onChange={(event) => updateDraft({ homeCity: event.target.value })}
                maxLength={60}
                placeholder="Rome, Italy"
                className={inputClassName}
              />
            </Field>
          </div>

          <Field
            label="Username"
            hint={
              usernameStatus === "checking" ? "Checking…" :
              usernameStatus === "taken" ? "Already taken" :
              usernameStatus === "reserved" ? "That name is reserved" :
              usernameStatus === "available" && draft.username.trim() ? "Available" :
              usernameStatus === "invalid" ? "3–30 chars, letters/numbers/_ only" :
              "Your link: packuptrip.com/username"
            }
            hintAccent={
              usernameStatus === "available" ? "green" :
              usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "reserved" ? "red" : undefined
            }
          >
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 select-none text-[14px] font-medium text-stone-400">@</span>
              <input
                type="text"
                value={draft.username}
                onChange={(event) => {
                  const val = event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                  updateDraft({ username: val });
                }}
                maxLength={30}
                placeholder="johnsolomon"
                className={`${inputClassName} pl-7`}
              />
            </div>
          </Field>

          <Field
            label="Bio"
            hint={`${draft.bio.length}/280 characters`}
          >
            <textarea
              value={draft.bio}
              onChange={(event) => updateDraft({ bio: event.target.value })}
              maxLength={280}
              rows={4}
              placeholder="Tell travellers how you travel, what you host, and what kind of people should join you."
              className={`${inputClassName} resize-none leading-6`}
            />
          </Field>
          </div>
        </EditorCard>

        <EditorCard
          eyebrow="Gallery"
          title="Photos from the road"
          description="Up to 12 — cover, About & Moments."
          tight
        >
          <ImagesEditor
            images={draft.profileGallery}
            onChange={(profileGallery) =>
              updateDraft({ profileGallery: profileGallery.slice(0, 12) })
            }
            accent="teal"
          />
        </EditorCard>

        <EditorCard
          eyebrow="Travel style"
          title="How you travel"
          description="Up to 5 tags."
          tight
        >
          <TagGrid>
            {STYLE_TAGS.map((tag) => {
              const selected = draft.styleTags.includes(tag);
              const disabled = draft.styleTags.length >= 5 && !selected;
              return (
                <ToggleChip
                  key={tag}
                  label={tag}
                  selected={selected}
                  disabled={disabled}
                  onClick={() => toggleValue(tag, draft.styleTags, "styleTags", 5)}
                />
              );
            })}
          </TagGrid>
        </EditorCard>

        <EditorCard
          eyebrow="Languages"
          title="Languages you speak"
          description="Shown on profile."
          tight
        >
          <TagGrid>
            {LANGUAGES.map((language) => {
              const selected = draft.languages.includes(language);
              return (
                <ToggleChip
                  key={language}
                  label={language}
                  selected={selected}
                  onClick={() => toggleValue(language, draft.languages, "languages")}
                />
              );
            })}
          </TagGrid>
        </EditorCard>

        {/* Contact & connect — each row has its own public/private toggle.
            Only fields the host marks public will render on the profile. */}
        <EditorCard
          eyebrow="Contact"
          title="Reach you"
          description="Toggle Public to show on profile."
          tight
        >
          <div className="divide-y divide-stone-100/90">
            <ContactRow
              label="Phone"
              hint="Include country code, e.g. +91 98765 43210"
              type="tel"
              placeholder="+91 98765 43210"
              value={draft.contact.phone}
              isPublic={draft.contact.phonePublic}
              onValueChange={(phone) => updateContact({ phone })}
              onPublicChange={(phonePublic) => updateContact({ phonePublic })}
            />
            <ContactRow
              label="WhatsApp"
              hint="Digits only with country code — becomes wa.me link"
              type="tel"
              placeholder="919876543210"
              value={draft.contact.whatsapp}
              isPublic={draft.contact.whatsappPublic}
              onValueChange={(whatsapp) => updateContact({ whatsapp })}
              onPublicChange={(whatsappPublic) => updateContact({ whatsappPublic })}
            />
            <ContactRow
              label="Email"
              hint="Public-facing email, not your login"
              type="email"
              placeholder="hello@yourdomain.com"
              value={draft.contact.email}
              isPublic={draft.contact.emailPublic}
              onValueChange={(email) => updateContact({ email })}
              onPublicChange={(emailPublic) => updateContact({ emailPublic })}
            />
            <ContactRow
              label="Instagram"
              hint="Handle only, no @"
              type="text"
              placeholder="yourhandle"
              value={draft.contact.instagram}
              isPublic={draft.contact.instagramPublic}
              onValueChange={(instagram) => updateContact({ instagram })}
              onPublicChange={(instagramPublic) => updateContact({ instagramPublic })}
            />
            <ContactRow
              label="Website"
              hint="https:// added automatically"
              type="url"
              placeholder="yourdomain.com"
              value={draft.contact.website}
              isPublic={draft.contact.websitePublic}
              onValueChange={(website) => updateContact({ website })}
              onPublicChange={(websitePublic) => updateContact({ websitePublic })}
            />
          </div>

          <div className="border-t border-stone-100/90 pt-2">
            <p className="mb-1 px-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400">
              Social · public when filled
            </p>
            <div className="divide-y divide-stone-100/90">
              <SocialRow
                label="Facebook"
                placeholder="facebook.com/yourpage"
                value={draft.contact.facebook}
                onChange={(facebook) => updateContact({ facebook })}
              />
              <SocialRow
                label="YouTube"
                placeholder="youtube.com/@yourchannel"
                value={draft.contact.youtube}
                onChange={(youtube) => updateContact({ youtube })}
              />
              <SocialRow
                label="LinkedIn"
                placeholder="linkedin.com/in/yourprofile"
                value={draft.contact.linkedin}
                onChange={(linkedin) => updateContact({ linkedin })}
              />
              <SocialRow
                label="X / Twitter"
                placeholder="yourhandle (no @)"
                value={draft.contact.twitter}
                onChange={(twitter) => updateContact({ twitter })}
              />
            </div>
          </div>
        </EditorCard>

        {/* Countries last — most tedious section (clicking through a long
            list), but ends the form with the satisfying world-map fill. */}
        <EditorCard
          eyebrow="Map"
          title="Countries visited"
          description="Lights up your profile map."
          tight
        >
          <CountryPicker
            selected={draft.countriesVisited}
            onChange={(countriesVisited) => updateDraft({ countriesVisited })}
          />
        </EditorCard>

        <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-stone-500">
            {saved ? (
              <span className="font-semibold text-[#2d5130]">Saved.</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span>Save before previewing.</span>
            )}
          </p>
          <div className="flex gap-2">
            <Link
              href={publicProfileHref}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-stone-200 bg-white px-3.5 text-[13px] font-bold text-stone-700 hover:bg-stone-50"
            >
              View profile
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#2d5130] px-5 text-[13px] font-bold text-white hover:bg-[#244329] disabled:opacity-50"
            >
              {isPending ? "Saving…" : saved ? "Saved" : "Save profile"}
            </button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-[4.5rem]">
        <ProfilePreview
          draft={draft}
          completion={completion}
          publicProfileHref={publicProfileHref}
          idVerified={profile.id_verified}
          hostTier={profile.host_tier}
        />
      </aside>
    </div>
  );
}

function AvatarUploader({
  userId,
  current,
  name,
  onUploaded,
}: {
  userId: string;
  current: string | null;
  name: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [preview, setPreview] = useState<string | null>(current);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const baseSize = (() => {
    const aspect = imgNatural.w / imgNatural.h;
    return aspect >= 1
      ? { w: CROP_DISPLAY * aspect, h: CROP_DISPLAY }
      : { w: CROP_DISPLAY, h: CROP_DISPLAY / aspect };
  })();

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function clamp(ox: number, oy: number, s: number) {
    const mx = Math.max(0, (baseSize.w * s - CROP_DISPLAY) / 2);
    const my = Math.max(0, (baseSize.h * s - CROP_DISPLAY) / 2);
    return {
      x: Math.max(-mx, Math.min(mx, ox)),
      y: Math.max(-my, Math.min(my, oy)),
    };
  }

  function onFileSelected(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErr("File too large. Max 5 MB.");
      return;
    }
    setErr(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImgLoaded(false);
    setImgNatural({ w: 1, h: 1 });
    setCropSrc(URL.createObjectURL(file));
  }

  function onImgLoad() {
    const img = imgRef.current;
    if (!img) return;
    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setImgLoaded(true);
  }

  function startDrag(cx: number, cy: number) {
    dragRef.current = { sx: cx, sy: cy, ox: offset.x, oy: offset.y };
  }

  function moveDrag(cx: number, cy: number) {
    if (!dragRef.current) return;
    const dx = cx - dragRef.current.sx;
    const dy = cy - dragRef.current.sy;
    setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, scale));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function changeScale(nextScale: number) {
    setScale(nextScale);
    setOffset(clamp(offset.x, offset.y, nextScale));
  }

  async function confirmCrop() {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUTPUT;
    canvas.height = CROP_OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CROP_OUTPUT, CROP_OUTPUT);

    const ratio = CROP_OUTPUT / CROP_DISPLAY;
    const visW = baseSize.w * scale;
    const visH = baseSize.h * scale;
    const left = (CROP_DISPLAY / 2 + offset.x - visW / 2) * ratio;
    const top = (CROP_DISPLAY / 2 + offset.y - visH / 2) * ratio;
    ctx.drawImage(img, left, top, visW * ratio, visH * ratio);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setCropSrc(null);
      await uploadFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: "image/jpeg" });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Upload failed");
      setPreview(current);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-2xl font-semibold text-[#17120f]">
              Crop your photo
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Drag to reposition, then use the slider to zoom.
            </p>
            <div className="my-6 flex justify-center">
              <div
                className="relative cursor-grab select-none overflow-hidden rounded-full bg-stone-100 shadow-lg ring-4 ring-white active:cursor-grabbing"
                style={{ width: CROP_DISPLAY, height: CROP_DISPLAY }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  startDrag(event.clientX, event.clientY);
                }}
                onMouseMove={(event) => moveDrag(event.clientX, event.clientY)}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={(event) =>
                  startDrag(event.touches[0].clientX, event.touches[0].clientY)
                }
                onTouchMove={(event) => {
                  event.preventDefault();
                  moveDrag(event.touches[0].clientX, event.touches[0].clientY);
                }}
                onTouchEnd={endDrag}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={cropSrc}
                  alt="Crop preview"
                  onLoad={onImgLoad}
                  draggable={false}
                  style={{
                    position: "absolute",
                    width: baseSize.w,
                    height: baseSize.h,
                    left: CROP_DISPLAY / 2 - baseSize.w / 2,
                    top: CROP_DISPLAY / 2 - baseSize.h / 2,
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: "center center",
                    pointerEvents: "none",
                    userSelect: "none",
                    maxWidth: "none",
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-stone-400">-</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={scale}
                onChange={(event) => changeScale(Number(event.target.value))}
                disabled={!imgLoaded}
                className="flex-1 accent-[#2d5130]"
              />
              <span className="text-stone-400">+</span>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={confirmCrop}
                disabled={!imgLoaded}
                className="flex-1 rounded-[8px] bg-[#2d5130] px-4 py-3 text-sm font-bold text-white hover:bg-[#244329] disabled:opacity-50"
              >
                Use this photo
              </button>
              <button
                type="button"
                onClick={() => setCropSrc(null)}
                className="rounded-[8px] border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative h-[88px] w-[88px] shrink-0 rounded-full bg-white p-1.5 shadow-md ring-1 ring-stone-100">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-stone-100">
            {preview ? (
              <Image
                src={preview}
                alt="Avatar preview"
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center font-serif text-4xl text-stone-400">
                {initials || "H"}
              </span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-2 grid place-items-center rounded-full bg-black/40 text-xs font-bold text-white">
              Saving
            </div>
          )}
        </div>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-10 items-center rounded-[8px] bg-[#2d5130] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#244329] disabled:opacity-60"
          >
            Change photo
          </button>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            Use a clear square-ish portrait. JPG, PNG or WebP, max 5 MB.
          </p>
          {err && <p className="mt-2 text-xs font-medium text-red-600">{err}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            event.target.value = "";
          }}
        />
      </div>
    </>
  );
}

function ProfilePreview({
  draft,
  completion,
  publicProfileHref,
  idVerified,
  hostTier,
}: {
  draft: DraftProfile;
  completion: number;
  publicProfileHref: string;
  idVerified: boolean;
  hostTier: Profile["host_tier"];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="relative h-24 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="-mt-10 px-4 pb-4">
        <div className="relative h-20 w-20 rounded-full bg-white p-1 shadow-md ring-2 ring-white">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-stone-100">
            {draft.avatarUrl ? (
              <Image
                src={draft.avatarUrl}
                alt={draft.name || "Host preview"}
                fill
                unoptimized
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center font-serif text-4xl text-stone-400">
                {(draft.name || "H").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45c3e]">
          Preview
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold leading-tight text-[#17120f]">
          {draft.name || "Your name"}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Travel Host
        </p>
        <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-stone-600">
          {draft.bio || "Your bio appears on your public profile."}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 border-y border-stone-100 py-3">
          <PreviewStat label="Home city" value={draft.homeCity || "Not set"} />
          <PreviewStat
            label="Languages"
            value={draft.languages.length ? String(draft.languages.length) : "0"}
          />
          <PreviewStat
            label="Travel styles"
            value={draft.styleTags.length ? String(draft.styleTags.length) : "0"}
          />
          <PreviewStat
            label="Countries"
            value={draft.countriesVisited.length ? String(draft.countriesVisited.length) : "0"}
          />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            <span>Profile strength</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[#2d5130] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-[12px]">
          <ChecklistItem done={!!draft.avatarUrl} label="Host photo added" />
          <ChecklistItem done={!!draft.bio.trim()} label="Bio written" />
          <ChecklistItem done={draft.styleTags.length > 0} label="Travel style selected" />
          <ChecklistItem done={draft.languages.length > 0} label="Languages selected" />
          <ChecklistItem done={idVerified} label="Identity verified" />
          {hostTier === "superhost" && <ChecklistItem done label="Superhost status" />}
        </div>

        <Link
          href={publicProfileHref}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#17120f] text-[13px] font-bold text-white hover:bg-stone-800"
        >
          Open public profile
        </Link>
      </div>
    </div>
  );
}

function EditorCard({
  eyebrow,
  title,
  description,
  tight = false,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
        {eyebrow}
      </p>
      <h2
        className={`font-serif font-semibold leading-snug text-[#17120f] ${
          tight ? "mt-0.5 text-base" : "mt-1 text-lg"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-0.5 text-[11px] leading-4 text-stone-500">{description}</p>
      ) : null}
      <div className={`${tight ? "mt-2" : "mt-3"} space-y-2`}>{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  hintAccent,
  children,
}: {
  label: string;
  hint?: string;
  hintAccent?: "green" | "red";
  children: ReactNode;
}) {
  const hintColor =
    hintAccent === "green" ? "text-[#2d5130]" :
    hintAccent === "red" ? "text-red-600" :
    "text-stone-400";
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2 text-[12px] font-semibold text-[#28231e]">
        <span>{label}</span>
        {hint && <span className={`text-xs font-medium ${hintColor}`}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function TagGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function ContactRow({
  label,
  hint,
  type,
  placeholder,
  value,
  isPublic,
  onValueChange,
  onPublicChange,
}: {
  label: string;
  hint: string;
  type: "tel" | "email" | "text" | "url";
  placeholder: string;
  value: string;
  isPublic: boolean;
  onValueChange: (v: string) => void;
  onPublicChange: (v: boolean) => void;
}) {
  const inputId = `contact-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const hasValue = value.trim().length > 0;
  return (
    <div className="grid grid-cols-[minmax(4.25rem,5rem)_minmax(0,1fr)_auto] items-center gap-x-2 py-1.5">
      <label htmlFor={inputId} className="text-[12px] font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        title={hint}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={compactInputClassName}
      />
      <VisibilityToggle
        isPublic={isPublic}
        disabled={!hasValue}
        onChange={onPublicChange}
      />
    </div>
  );
}

function SocialRow({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputId = `social-${label.toLowerCase().replace(/[\s/]+/g, "-")}`;
  return (
    <div className="grid grid-cols-[minmax(4.25rem,5rem)_minmax(0,1fr)] items-center gap-x-2 py-1.5">
      <label htmlFor={inputId} className="text-[12px] font-semibold text-stone-700">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={compactInputClassName}
      />
    </div>
  );
}

function VisibilityToggle({
  isPublic,
  disabled,
  onChange,
}: {
  isPublic: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  const label = disabled ? "Add value" : isPublic ? "Public" : "Private";

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isPublic)}
      disabled={disabled}
      aria-pressed={isPublic}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors ${
        disabled ? "cursor-not-allowed opacity-40" : "hover:opacity-90"
      }`}
    >
      <span
        className={`relative inline-block h-5 w-9 rounded-full transition-colors ${
          isPublic ? "bg-[#2d5130]" : "bg-stone-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
            isPublic ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function ToggleChip({
  label,
  selected,
  disabled = false,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[12px] font-semibold transition ${
        selected
          ? "border-[#2d5130] bg-[#2d5130] text-white shadow-sm"
          : disabled
            ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300"
            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-stone-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#28231e]">{value}</p>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-stone-600">
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
          done ? "bg-[#2d5130] text-white" : "bg-stone-100 text-stone-400"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span>{label}</span>
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-stone-200 bg-[#fbfaf7] px-3 py-2 text-sm text-[#28231e] placeholder:text-stone-400 outline-none transition focus:border-[#2d5130] focus:bg-white focus:ring-2 focus:ring-[#2d5130]/12";

const compactInputClassName =
  "min-w-0 w-full rounded-md border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-[13px] text-[#28231e] placeholder:text-stone-400 outline-none transition focus:border-[#2d5130] focus:bg-white focus:ring-1 focus:ring-[#2d5130]/15";
