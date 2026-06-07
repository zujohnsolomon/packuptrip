"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { compareFaces, type FaceCompareResult } from "./faceCompare";
import { createClient } from "@/lib/supabase/client";
import { submitVerification } from "@/actions/verification";
import type { IdType } from "@/types/db";

const FaceScanner = dynamic(
  () => import("./FaceScanner").then((m) => m.FaceScanner),
  { ssr: false },
);

// ─── ID type metadata ─────────────────────────────────────────────────────────

type IdConfig = {
  key: IdType;
  label: string;
  placeholder: string;
  hint: string;
  pattern: RegExp;
  normalize: (s: string) => string;
  icon: React.ReactNode;
};

const ID_TYPES: IdConfig[] = [
  {
    key: "aadhaar",
    label: "Aadhaar Card",
    placeholder: "1234 5678 9012",
    hint: "12-digit UID",
    pattern: /^\d{12}$/,
    normalize: (s) => s.replace(/\s/g, ""),
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
    placeholder: "ABCDE1234F",
    hint: "10-character alphanumeric",
    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    normalize: (s) => s.toUpperCase().replace(/\s/g, ""),
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
    placeholder: "A1234567",
    hint: "8-character passport number",
    pattern: /^[A-Z][1-9][0-9]{7}$/,
    normalize: (s) => s.toUpperCase().replace(/\s/g, ""),
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
    placeholder: "MH0120110000001",
    hint: "State code + 13-digit number",
    pattern: /^[A-Z]{2}[0-9A-Z]{11,14}$/,
    normalize: (s) => s.toUpperCase().replace(/[\s\-]/g, ""),
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
}: {
  label: string;
  hint: string;
  preview: string | null;
  onFile: (f: File) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ink">{label}</div>
      <label className="block cursor-pointer">
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 transition-colors hover:border-yellow-300 hover:bg-yellow-50/40"
          style={{ minHeight: 160 }}
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
        </div>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
      </label>
      {preview && (
        <label className="mt-2 block cursor-pointer text-xs text-stone-400 underline hover:text-stone-600">
          Change photo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          />
        </label>
      )}
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
      done ? "bg-green-600 text-white" :
      active ? "bg-yellow-500 text-stone-900" :
      "bg-stone-100 text-stone-400"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function VerifyClient({ userId }: { userId: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [idType, setIdType] = useState<IdType | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [idNumberError, setIdNumberError] = useState<string | null>(null);

  // Step 2
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);

  // Step 3
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [faceMatch, setFaceMatch] = useState<FaceCompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  // Submit state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedType = ID_TYPES.find((t) => t.key === idType);

  function validateIdNumber(value: string) {
    if (!selectedType) return;
    const normalized = selectedType.normalize(value);
    if (!normalized) {
      setIdNumberError(null);
      return;
    }
    if (!selectedType.pattern.test(normalized)) {
      setIdNumberError(`Format: ${selectedType.hint}`);
    } else {
      setIdNumberError(null);
    }
  }

  function handleIdNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdNumber(e.target.value);
    validateIdNumber(e.target.value);
  }

  function step1Valid() {
    if (!idType || !selectedType) return false;
    const normalized = selectedType.normalize(idNumber);
    return normalized.length > 0 && selectedType.pattern.test(normalized) && !idNumberError;
  }

  function handleIdDoc(file: File) {
    setIdDocFile(file);
    setIdDocPreview(URL.createObjectURL(file));
  }

  const handleFaceCapture = useCallback((blob: Blob) => {
    setFaceBlob(blob);
  }, []);

  // Auto-run face comparison whenever both ID doc and face scan are ready
  useEffect(() => {
    if (!idDocFile || !faceBlob) return;
    let cancelled = false;
    setComparing(true);
    setFaceMatch(null);
    compareFaces(idDocFile, faceBlob).then((result) => {
      if (!cancelled) {
        setFaceMatch(result);
        setComparing(false);
      }
    });
    return () => { cancelled = true; };
  }, [idDocFile, faceBlob]);

  async function handleSubmit() {
    if (!idType || !selectedType || !idDocFile || !faceBlob) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Upload ID document
      const idExt = idDocFile.name.split(".").pop() ?? "jpg";
      const idPath = `${userId}/id-doc.${idExt}`;
      const { error: idErr } = await supabase.storage
        .from("id-documents")
        .upload(idPath, idDocFile, { upsert: true, contentType: idDocFile.type });
      if (idErr) throw new Error(idErr.message);

      // Upload face scan
      const selfiePath = `${userId}/selfie.jpg`;
      const { error: selfieErr } = await supabase.storage
        .from("id-documents")
        .upload(selfiePath, faceBlob, { upsert: true, contentType: "image/jpeg" });
      if (selfieErr) throw new Error(selfieErr.message);

      // Submit to DB (server action hashes id_number and checks duplicates)
      const normalized = selectedType.normalize(idNumber);
      const { error: dbErr } = await submitVerification({
        idType,
        idNumber: normalized,
        idDocPath: idPath,
        selfiePath,
        faceMatchScore: faceMatch?.score ?? undefined,
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
        <p className="mt-4 text-xl font-semibold text-emerald-900">Submitted — you&apos;re all set</p>
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
        <span>ID &amp; Number</span>
        <span>Document</span>
        <span>Face Scan</span>
      </div>

      {/* Step 1 — ID type + number */}
      <div className={`rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-opacity ${step !== 1 ? "pointer-events-none opacity-40" : ""}`}>
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
                onClick={() => {
                  setIdType(t.key);
                  setIdNumber("");
                  setIdNumberError(null);
                }}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? "border-yellow-400 bg-yellow-50 text-yellow-500 shadow-sm"
                    : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span className={selected ? "text-yellow-400" : "text-stone-400"}>{t.icon}</span>
                <span>
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-xs opacity-70">{t.hint}</div>
                </span>
              </button>
            );
          })}
        </div>

        {/* ID number input — shown after type is selected */}
        {idType && selectedType && (
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Your {selectedType.label} number
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={handleIdNumberChange}
              placeholder={selectedType.placeholder}
              autoComplete="off"
              spellCheck={false}
              className={`w-full rounded-xl border px-4 py-2.5 font-mono text-sm tracking-wider text-ink placeholder:font-sans placeholder:tracking-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
                idNumberError
                  ? "border-red-300 focus:border-red-300 focus:ring-red-100"
                  : step1Valid()
                    ? "border-green-300 focus:border-green-300 focus:ring-green-100"
                    : "border-stone-200 focus:border-yellow-300 focus:ring-yellow-100"
              }`}
            />
            {idNumberError && (
              <p className="mt-1 text-xs text-red-600">{idNumberError}</p>
            )}
            {!idNumberError && idNumber && (
              <p className="mt-1 text-xs text-stone-400">{selectedType.hint}</p>
            )}
          </div>
        )}

        {step1Valid() && (
          <button
            type="button"
            className="mt-4 w-full rounded-full bg-yellow-500 py-2.5 text-sm font-semibold text-stone-900 hover:bg-yellow-400"
            onClick={() => setStep(2)}
          >
            Continue →
          </button>
        )}
      </div>

      {/* Step 2 — Upload ID document */}
      {step >= 2 && (
        <div className={`rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ${step !== 2 ? "pointer-events-none opacity-40" : ""}`}>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Step 2 — Upload your {selectedType?.label}
          </h2>
          <p className="mb-4 text-xs text-stone-400">
            Clear photo — all four corners visible, no glare or blur. Do not upload a screenshot.
          </p>
          <UploadZone
            label="Front of your ID"
            hint="Flat surface, good lighting, full card in frame"
            preview={idDocPreview}
            onFile={handleIdDoc}
          />
          {idDocFile && (
            <button
              type="button"
              className="mt-4 w-full rounded-full bg-yellow-500 py-2.5 text-sm font-semibold text-stone-900 hover:bg-yellow-400"
              onClick={() => setStep(3)}
            >
              Continue →
            </button>
          )}
        </div>
      )}

      {/* Step 3 — Face scan */}
      {step >= 3 && (
        <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-stone-400">
            Step 3 — Face scan
          </h2>
          <p className="mb-4 text-xs text-stone-400">
            Position your face in the oval and blink once to confirm you are present in real time.
            No hat, sunglasses, or mask.
          </p>
          <FaceScanner onCapture={handleFaceCapture} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      )}

      {/* Face match result */}
      {step === 3 && faceBlob && (
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Face match result
          </div>
          {comparing && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
              Comparing your face to your ID photo…
            </div>
          )}
          {!comparing && faceMatch && (
            <div className={`flex items-start gap-3 rounded-xl p-3 ${
              faceMatch.score === null
                ? "bg-stone-50 text-stone-600"
                : faceMatch.status === "match"
                  ? "bg-green-50 text-green-800"
                  : faceMatch.status === "partial"
                    ? "bg-yellow-50 text-yellow-800"
                    : "bg-red-50 text-red-800"
            }`}>
              <span className="text-lg leading-none">
                {faceMatch.score === null ? "🔍" : faceMatch.status === "match" ? "✓" : faceMatch.status === "partial" ? "⚠" : "✕"}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {faceMatch.score === null
                    ? faceMatch.status === "no-face-id"
                      ? "Could not detect a face on your ID photo"
                      : faceMatch.status === "no-face-scan"
                        ? "Could not detect a face in your scan"
                        : "Face detection unavailable"
                    : faceMatch.status === "match"
                      ? `Faces match (${((faceMatch.score) * 100).toFixed(0)}%)`
                      : faceMatch.status === "partial"
                        ? `Partial match (${((faceMatch.score) * 100).toFixed(0)}%) — admin will review`
                        : `Face mismatch (${((faceMatch.score) * 100).toFixed(0)}%) — please retake scan`}
                </p>
                {faceMatch.score !== null && faceMatch.status === "mismatch" && (
                  <p className="mt-0.5 text-xs opacity-80">
                    Make sure you are in good lighting and your face is clearly visible in both your ID and the scan.
                  </p>
                )}
                {faceMatch.score === null && faceMatch.status === "no-face-id" && (
                  <p className="mt-0.5 text-xs opacity-80">
                    Try uploading a clearer photo of your ID with the face section fully visible.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit — only once face captured and not a hard mismatch */}
      {step === 3 && faceBlob && faceMatch?.status !== "mismatch" && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading || comparing}
          className="w-full rounded-full bg-green-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:opacity-60"
        >
          {uploading ? "Uploading securely…" : comparing ? "Verifying…" : "Submit for review 🛡️"}
        </button>
      )}
    </div>
  );
}
