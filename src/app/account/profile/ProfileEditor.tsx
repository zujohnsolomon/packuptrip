"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/actions/profile";
import type { Profile } from "@/types/db";

// ─── Travel style options ─────────────────────────────────────────────────────

const STYLE_TAGS = [
  { key: "Adventure", emoji: "🧗" },
  { key: "Budget", emoji: "💸" },
  { key: "Luxury", emoji: "✨" },
  { key: "Offbeat", emoji: "🗺️" },
  { key: "Foodie", emoji: "🍜" },
  { key: "Culture", emoji: "🏛️" },
  { key: "Nature", emoji: "🌿" },
  { key: "Backpacking", emoji: "🎒" },
  { key: "Road Trip", emoji: "🚗" },
  { key: "Beach", emoji: "🏖️" },
  { key: "Mountains", emoji: "⛰️" },
  { key: "Spiritual", emoji: "🙏" },
];

const LANGUAGES = [
  { key: "English", flag: "🇬🇧" },
  { key: "Hindi", flag: "🇮🇳" },
  { key: "Tamil", flag: "🇮🇳" },
  { key: "Telugu", flag: "🇮🇳" },
  { key: "Kannada", flag: "🇮🇳" },
  { key: "Malayalam", flag: "🇮🇳" },
  { key: "Marathi", flag: "🇮🇳" },
  { key: "Bengali", flag: "🇮🇳" },
  { key: "Gujarati", flag: "🇮🇳" },
  { key: "Punjabi", flag: "🇮🇳" },
  { key: "French", flag: "🇫🇷" },
  { key: "Spanish", flag: "🇪🇸" },
  { key: "German", flag: "🇩🇪" },
  { key: "Japanese", flag: "🇯🇵" },
  { key: "Arabic", flag: "🇦🇪" },
];

// ─── Avatar uploader ──────────────────────────────────────────────────────────

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
  const [preview, setPreview] = useState<string | null>(current);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErr("File too large — max 5 MB");
      return;
    }
    setUploading(true);
    setErr(null);
    setPreview(URL.createObjectURL(file));

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploaded(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
      setPreview(current);
    } finally {
      setUploading(false);
    }
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <div className="h-24 w-24 overflow-hidden rounded-full bg-yellow-100 ring-4 ring-white shadow-md">
          {preview ? (
            <img src={preview} alt="Avatar" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-yellow-500">
              {initials}
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 text-stone-900 shadow ring-2 ring-white hover:bg-yellow-400 disabled:opacity-60"
          aria-label="Change photo"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm font-medium text-yellow-400 hover:text-yellow-500 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        <p className="mt-0.5 text-[11px] text-stone-400">JPG, PNG or WebP · max 5 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

// ─── Pill toggle button ───────────────────────────────────────────────────────

function PillToggle({
  label,
  prefix,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  prefix?: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
        selected
          ? "bg-yellow-500 text-stone-900 shadow-sm"
          : disabled
          ? "cursor-not-allowed bg-stone-100 text-stone-300"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {prefix && <span>{prefix}</span>}
      {label}
    </button>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function ProfileEditor({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [homeCity, setHomeCity] = useState(profile.home_city ?? "");
  const [styleTags, setStyleTags] = useState<string[]>(profile.travel_style_tags ?? []);
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleTag(key: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(key) ? list.filter((t) => t !== key) : [...list, key]);
  }

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const { error: err } = await updateProfile({
        name,
        bio,
        homeCity,
        travelStyleTags: styleTags,
        languages,
        avatarUrl,
      });
      if (err) {
        setError(err);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  // Profile completeness score
  const fields = [
    !!name,
    !!bio,
    !!homeCity,
    styleTags.length > 0,
    languages.length > 0,
    !!(avatarUrl ?? profile.avatar_url),
  ];
  const pct = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const isComplete = pct === 100;

  return (
    <div className="space-y-6">
      {/* Completeness bar */}
      {!isComplete && (
        <div className="rounded-2xl bg-yellow-50 p-4 ring-1 ring-inset ring-yellow-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-yellow-500">Profile {pct}% complete</span>
            <span className="text-xs text-yellow-500">
              Hosts with full profiles get 3× more joiners
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-yellow-100">
            <div
              className="h-full rounded-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Photo
        </h2>
        <AvatarUploader
          userId={profile.id}
          current={profile.avatar_url}
          name={name || "?"}
          onUploaded={(url) => setAvatarUrl(url)}
        />
      </div>

      {/* Basic info */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-stone-400">
          About you
        </h2>
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Display name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              placeholder="How you want to appear to other travellers"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-yellow-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Home city
            </label>
            <input
              type="text"
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              maxLength={60}
              placeholder="e.g. Mumbai, Bengaluru, Chennai…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-yellow-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Bio
              <span className="ml-2 text-xs font-normal text-stone-400">
                ({bio.length}/280)
              </span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="What kind of traveller are you? What do you love about exploring?"
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-ink placeholder:text-stone-400 focus:border-yellow-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-100"
            />
          </div>
        </div>
      </div>

      {/* Travel style tags */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Travel style
        </h2>
        <p className="mb-4 text-xs text-stone-500">Pick up to 5 tags that describe how you travel.</p>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((t) => {
            const selected = styleTags.includes(t.key);
            const maxed = styleTags.length >= 5 && !selected;
            return (
              <PillToggle
                key={t.key}
                label={t.key}
                prefix={t.emoji}
                selected={selected}
                disabled={maxed}
                onClick={() => toggleTag(t.key, styleTags, setStyleTags)}
              />
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Spoken languages
        </h2>
        <p className="mb-4 text-xs text-stone-500">
          Helps travellers know they can communicate with you.
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const selected = languages.includes(l.key);
            return (
              <PillToggle
                key={l.key}
                label={l.key}
                prefix={l.flag}
                selected={selected}
                disabled={false}
                onClick={() => toggleTag(l.key, languages, setLanguages)}
              />
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      )}

      {/* Save row */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <a
          href={`/hosts/${profile.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-stone-500 underline-offset-2 hover:text-ink hover:underline"
        >
          View public profile →
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-yellow-500 px-7 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:bg-yellow-400 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : saved ? "✓ Saved" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
