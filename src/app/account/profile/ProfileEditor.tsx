"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/profile";
import { CountryPicker } from "@/components/shared/CountryPicker";
import { ImagesEditor } from "@/components/shared/ImagesEditor";
import type { Profile } from "@/types/db";

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

type DraftProfile = {
  name: string;
  bio: string;
  homeCity: string;
  styleTags: string[];
  languages: string[];
  countriesVisited: string[];
  profileGallery: string[];
  avatarUrl: string | null;
};

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftProfile>({
    name: profile.name ?? "",
    bio: profile.bio ?? "",
    homeCity: profile.home_city ?? "",
    styleTags: profile.travel_style_tags ?? [],
    languages: profile.languages ?? [],
    countriesVisited: profile.countries_visited ?? [],
    profileGallery: profile.profile_gallery ?? [],
    avatarUrl: profile.avatar_url,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const publicProfileHref = `/hosts/${profile.id}`;
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
        bio: draft.bio,
        homeCity: draft.homeCity,
        travelStyleTags: draft.styleTags,
        languages: draft.languages,
        countriesVisited: draft.countriesVisited,
        profileGallery: draft.profileGallery,
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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-5">
        <EditorCard
          eyebrow="Profile photo"
          title="Your face on the host page"
          description="This appears in the large circular frame on your public host profile."
        >
          <AvatarUploader
            userId={profile.id}
            current={draft.avatarUrl}
            name={draft.name || "Host"}
            onUploaded={(url) => updateDraft({ avatarUrl: url })}
          />
        </EditorCard>

        <EditorCard
          eyebrow="Public identity"
          title="Name, home city and intro"
          description="These fields feed the hero, About section and sidebar facts on your host profile."
        >
          <div className="grid gap-5 sm:grid-cols-2">
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
            label="Bio"
            hint={`${draft.bio.length}/280 characters`}
          >
            <textarea
              value={draft.bio}
              onChange={(event) => updateDraft({ bio: event.target.value })}
              maxLength={280}
              rows={5}
              placeholder="Tell travellers how you travel, what you host, and what kind of people should join you."
              className={`${inputClassName} resize-none leading-6`}
            />
          </Field>
        </EditorCard>

        {/* Photos sit right after the basic identity — they power the hero,
            About feature image, and Moments grid, so they have the biggest
            visual impact on the public profile. */}
        <EditorCard
          eyebrow="Gallery"
          title="Photos from the road"
          description="Upload up to 12 personal photos. These power the cover image, the About section feature photo, the Moments grid, and the Gallery tab — falling back to your trip photos only if this is empty."
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
          eyebrow="Travel personality"
          title="Travel style"
          description="Pick up to five. These show as icon labels in the About section."
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
          eyebrow="Communication"
          title="Languages you speak"
          description="These appear in the right sidebar on your public host profile."
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

        {/* Countries last — most tedious section (clicking through a long
            list), but ends the form with the satisfying world-map fill. */}
        <EditorCard
          eyebrow="Travel history"
          title="Countries visited"
          description="Tick every country you've been to. They light up green on the world map on your public profile."
        >
          <CountryPicker
            selected={draft.countriesVisited}
            onChange={(countriesVisited) => updateDraft({ countriesVisited })}
          />
        </EditorCard>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white/90 p-3 shadow-[0_18px_50px_rgba(41,37,36,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-stone-500">
            {saved ? (
              <span className="font-semibold text-[#2d5130]">Saved to your public profile.</span>
            ) : (
              <span>Save changes before checking the public page.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={publicProfileHref}
              className="inline-flex h-11 items-center justify-center rounded-[8px] border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              View profile
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[#2d5130] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#244329] disabled:opacity-60"
            >
              {isPending ? "Saving..." : saved ? "Saved" : "Save profile"}
            </button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24">
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

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 rounded-full bg-white p-2 shadow-[0_14px_36px_rgba(64,44,26,0.14)]">
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
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_rgba(64,44,26,0.08)]">
      <div className="relative h-32 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="-mt-14 px-6 pb-6">
        <div className="relative h-28 w-28 rounded-full bg-white p-2 shadow-[0_14px_34px_rgba(41,37,36,0.16)]">
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

        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#b35a42]">
          Public host profile
        </p>
        <h3 className="mt-2 font-serif text-3xl font-semibold leading-none text-[#17120f]">
          {draft.name || "Your name"}
        </h3>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-stone-500">
          Travel Host
        </p>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {draft.bio || "Your bio will appear here on the public host profile."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-stone-100 py-5">
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

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
            <span>Profile strength</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[#2d5130] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <ChecklistItem done={!!draft.avatarUrl} label="Host photo added" />
          <ChecklistItem done={!!draft.bio.trim()} label="Bio written" />
          <ChecklistItem done={draft.styleTags.length > 0} label="Travel style selected" />
          <ChecklistItem done={draft.languages.length > 0} label="Languages selected" />
          <ChecklistItem done={idVerified} label="Identity verified" />
          {hostTier === "superhost" && <ChecklistItem done label="Superhost status" />}
        </div>

        <Link
          href={publicProfileHref}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[#17120f] px-4 text-sm font-bold text-white hover:bg-stone-800"
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
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_14px_36px_rgba(64,44,26,0.06)] sm:p-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-400">
        {eyebrow}
      </p>
      <div className="mt-2 max-w-2xl">
        <h2 className="font-serif text-3xl font-semibold leading-tight text-[#17120f]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-[#28231e]">
        <span>{label}</span>
        {hint && <span className="text-xs font-medium text-stone-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function TagGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
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
      className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-bold transition ${
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
  "w-full rounded-xl border border-stone-200 bg-[#fbfaf7] px-4 py-3 text-sm text-[#28231e] placeholder:text-stone-400 outline-none transition focus:border-[#2d5130] focus:bg-white focus:ring-4 focus:ring-[#2d5130]/10";
