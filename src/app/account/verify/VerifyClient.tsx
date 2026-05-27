"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitVerification } from "@/actions/verification";
import type { IdType } from "@/types/db";

// ─── ID type options ──────────────────────────────────────────────────────────

const ID_TYPES: { key: IdType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: "aadhaar",
    label: "Aadhaar Card",
    desc: "12-digit UID",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="9" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M14 11h8M14 14h6M14 17h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "pan",
    label: "PAN Card",
    desc: "10-character ID",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 11h16M6 15h10M6 19h7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "passport",
    label: "Passport",
    desc: "Indian passport",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="2" width="18" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="12" r="4" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 20h12M10 23h8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "driving_licence",
    label: "Driving Licence",
    desc: "State-issued DL",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="2" y="6" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8.5" cy="14" r="3" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M14 11h8M14 14.5h6M14 18h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
];

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  label,
  hint,
  preview,
  onFile,
  accept,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ink">{label}</div>
      <div
        className="relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
        style={{ minHeight: 160 }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-contain"
            style={{ maxHeight: 200 }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-stone-300">
              <path d="M18 4v20M10 12l8-8 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 28h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-sm font-medium text-stone-500">Click or drag to upload</span>
            <span className="text-xs text-stone-400">{hint}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept ?? "image/*"}
          capture={undefined}
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </div>
      {preview && (
        <button
          type="button"
          className="mt-2 text-xs text-stone-400 underline hover:text-stone-600"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Change photo
        </button>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
        done ? "bg-green-600 text-white" :
        active ? "bg-indigo-500 text-white" :
        "bg-stone-100 text-stone-400"
      }`}>
        {done ? "✓" : n}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function VerifyClient({ userId }: { userId: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [idType, setIdType] = useState<IdType | null>(null);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleIdDoc(file: File) {
    if (!file.name) return;
    setIdDocFile(file);
    setIdDocPreview(URL.createObjectURL(file));
  }

  function handleSelfie(file: File) {
    if (!file.name) return;
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!idType || !idDocFile || !selfieFile) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Upload ID doc
      const idExt = idDocFile.name.split(".").pop() ?? "jpg";
      const idPath = `${userId}/id-doc.${idExt}`;
      const { error: idErr } = await supabase.storage
        .from("id-documents")
        .upload(idPath, idDocFile, { upsert: true, contentType: idDocFile.type });
      if (idErr) throw new Error(idErr.message);

      // Upload selfie
      const selfieExt = selfieFile.name.split(".").pop() ?? "jpg";
      const selfiePath = `${userId}/selfie.${selfieExt}`;
      const { error: selfieErr } = await supabase.storage
        .from("id-documents")
        .upload(selfiePath, selfieFile, { upsert: true, contentType: selfieFile.type });
      if (selfieErr) throw new Error(selfieErr.message);

      // Submit to DB
      const { error: dbErr } = await submitVerification({
        idType,
        idDocPath: idPath,
        selfiePath,
      });
      if (dbErr) throw new Error(dbErr);

      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-inset ring-emerald-200">
        <div className="text-5xl">🛡️</div>
        <p className="mt-4 text-xl font-semibold text-emerald-900">Submitted — you're all set</p>
        <p className="mt-2 text-sm text-emerald-700">
          Our trust team will review your documents within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        <StepDot n={1} active={step === 1} done={step > 1} />
        <div className={`h-px w-12 transition-colors ${step > 1 ? "bg-green-500" : "bg-stone-200"}`} />
        <StepDot n={2} active={step === 2} done={step > 2} />
        <div className={`h-px w-12 transition-colors ${step > 2 ? "bg-green-500" : "bg-stone-200"}`} />
        <StepDot n={3} active={step === 3} done={false} />
      </div>
      <div className="flex justify-center gap-[52px] text-[10px] font-medium uppercase tracking-wider text-stone-400">
        <span>ID type</span>
        <span>Document</span>
        <span>Selfie</span>
      </div>

      {/* Step 1 — ID type */}
      <div className={`rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-opacity ${step !== 1 ? "opacity-50" : ""}`}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Step 1 — Choose your ID type
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {ID_TYPES.map((t) => {
            const selected = idType === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setIdType(t.key); if (step === 1) setStep(2); }}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-indigo-400 bg-indigo-50 text-indigo-900 shadow-sm"
                    : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className={selected ? "text-indigo-600" : "text-stone-400"}>{t.icon}</span>
                <span>
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-xs opacity-70">{t.desc}</div>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — ID document */}
      {step >= 2 && (
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Step 2 — Upload your {ID_TYPES.find(t => t.key === idType)?.label}
          </h2>
          <UploadZone
            label="Front of your ID"
            hint="Clear photo — all four corners visible, no glare"
            preview={idDocPreview}
            onFile={handleIdDoc}
          />
          {idDocFile && idDocFile.name && (
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"
              onClick={() => setStep(3)}
            >
              Continue →
            </button>
          )}
        </div>
      )}

      {/* Step 3 — Selfie */}
      {step >= 3 && (
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Step 3 — Selfie with your ID
          </h2>
          <div className="mb-4 rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
            Hold your {ID_TYPES.find(t => t.key === idType)?.label} next to your face so both are clearly visible. Good lighting, no hats or sunglasses.
          </div>
          <UploadZone
            label="Photo of you holding your ID"
            hint="Face and ID both in frame, clearly lit"
            preview={selfiePreview}
            onFile={handleSelfie}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      )}

      {/* Submit */}
      {step === 3 && selfieFile && selfieFile.name && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full rounded-full bg-green-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:opacity-60"
        >
          {uploading ? "Uploading securely…" : "Submit for review 🛡️"}
        </button>
      )}
    </div>
  );
}
