"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "trip-photos";

/**
 * Shared photo-editor for hosts (TripEditor) and admins (PackageEditor).
 *
 * - Upload directly to Supabase Storage (`trip-photos` bucket, public read,
 *   per-user write via storage RLS) - drag-drop or click to select.
 * - URL paste still supported as a fallback for already-hosted images.
 * - Drag to reorder. First image is the cover.
 */
export function ImagesEditor({
  images,
  onChange,
  accent = "amber",
}: {
  images: string[];
  onChange: (next: string[]) => void;
  /** Tints the hover/active outline. Amber for Originals, teal for trips. */
  accent?: "amber" | "teal";
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dropTint =
    accent === "teal"
      ? "hover:border-green-500 hover:bg-green-50"
      : "hover:border-yellow-400 hover:bg-yellow-50";
  const activeTint =
    accent === "teal" ? "border-green-600 bg-green-50" : "border-yellow-500 bg-yellow-50";

  async function uploadOne(file: File): Promise<string | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`${file.name}: only JPEG, PNG, or WebP.`);
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`${file.name}: too large (max 5 MB).`);
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in before uploading photos.");

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const path = `${user.id}/${name}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return publicUrl;
  }

  async function handleFiles(fileList: FileList | File[] | null) {
    if (!fileList || (fileList as FileList).length === 0) return;
    const files = Array.from(fileList as ArrayLike<File>);
    setError(null);
    setUploading(true);
    try {
      const next: string[] = [...images];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        const url = await uploadOne(files[i]);
        if (url) next.push(url);
        onChange(next.slice());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addUrlRow() {
    onChange([...images, ""]);
  }

  function updateRow(idx: number, value: string) {
    const next = [...images];
    next[idx] = value;
    onChange(next);
  }

  function removeRow(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {/* Drop zone / picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "rounded-xl border border-dashed border-stone-300 bg-stone-50/50 p-4 text-center transition-colors",
          dropTint,
          dragOver ? activeTint : "",
        ].join(" ")}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="text-sm font-semibold text-ink">
          Drop photos here, or
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="ml-1 font-semibold text-yellow-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            choose files
          </button>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          JPEG / PNG / WebP · up to 5 MB each · first photo is the cover
        </p>
        {progress && (
          <p className="mt-2 text-xs font-medium text-yellow-500">{progress}</p>
        )}
        {error && (
          <p className="mt-2 text-xs font-medium text-red-700">{error}</p>
        )}
      </div>

      {/* Existing rows */}
      {images.length > 0 && (
        <ul className="space-y-2">
          {images.map((url, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-1.5"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {url ? (
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[10px] text-stone-400">
                    preview
                  </span>
                )}
                {idx === 0 && url && (
                  <span className="absolute left-1 top-1 inline-flex items-center rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Cover
                  </span>
                )}
              </div>
              <input
                type="url"
                value={url}
                placeholder="https://…"
                onChange={(e) => updateRow(idx, e.target.value)}
                className="block min-w-0 flex-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-[12px] text-ink placeholder-stone-400 focus:border-[#2d5130] focus:outline-none focus:ring-1 focus:ring-[#2d5130]/15"
              />
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="inline-flex h-7 w-6 items-center justify-center rounded border border-stone-200 bg-white text-[10px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === images.length - 1}
                  className="inline-flex h-7 w-6 items-center justify-center rounded border border-stone-200 bg-white text-[10px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="inline-flex h-7 shrink-0 items-center justify-center rounded border border-stone-200 px-2 text-[10px] font-medium text-stone-600 hover:bg-stone-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addUrlRow}
        className="inline-flex h-9 items-center rounded-full border border-dashed border-stone-300 px-4 text-xs font-medium text-stone-600 hover:border-stone-400 hover:bg-stone-50"
      >
        + Or paste a URL
      </button>
    </div>
  );
}
