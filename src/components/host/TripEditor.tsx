"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagesEditor } from "@/components/shared/ImagesEditor";
import type { ItineraryDay, TripStatus } from "@/types/db";

export type TripEditorDefaults = {
  id?: string;
  title: string;
  location: string;
  description: string;
  days: number;
  price_per_share: number;
  start_date: string;
  spots_total: number;
  spots_left: number;
  status: TripStatus;
  images: string[];
  itinerary: ItineraryDay[];
  tags: string[];
  includes: string[];
};

export const blankTrip: TripEditorDefaults = {
  title: "",
  location: "",
  description: "",
  days: 5,
  price_per_share: 0,
  start_date: "",
  spots_total: 6,
  spots_left: 6,
  status: "draft",
  images: [],
  itinerary: [],
  tags: [],
  includes: [],
};

export function TripEditor({
  defaults,
  action,
  mode,
}: {
  defaults: TripEditorDefaults;
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
}) {
  const [images, setImages] = useState<string[]>(defaults.images);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(defaults.itinerary);

  return (
    <form action={action} className="space-y-8 pb-32">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      <input
        type="hidden"
        name="images_json"
        value={JSON.stringify(images.filter(Boolean))}
      />
      <input
        type="hidden"
        name="itinerary_json"
        value={JSON.stringify(
          itinerary.map((d, i) => ({ ...d, day: i + 1 })),
        )}
      />

      <Section
        title="Basics"
        subtitle="The headline info travellers see first."
      >
        <Field label="Trip title" hint="Something specific - 'Spiti road trip - 4 riders' beats 'Mountain trip'.">
          <input
            name="title"
            type="text"
            required
            defaultValue={defaults.title}
            placeholder="e.g. Ladakh on bikes - looking for 2 more"
            className={inputCls}
          />
        </Field>
        <Field label="Where">
          <input
            name="location"
            type="text"
            required
            defaultValue={defaults.location}
            placeholder="e.g. Leh · Pangong · Nubra"
            className={inputCls}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Days">
            <input
              name="days"
              type="number"
              min={1}
              required
              defaultValue={defaults.days}
              className={inputCls}
            />
          </Field>
          <Field label="Start date">
            <input
              name="start_date"
              type="date"
              required
              defaultValue={defaults.start_date}
              className={inputCls}
            />
          </Field>
          <Field label="Per share (₹)" hint="What each joiner pays you.">
            <input
              name="price_per_share"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={defaults.price_per_share}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Total spots" hint="Including you.">
            <input
              name="spots_total"
              type="number"
              min={1}
              required
              defaultValue={defaults.spots_total}
              className={inputCls}
            />
          </Field>
          <Field label="Spots left" hint="Usually = total when you first post.">
            <input
              name="spots_left"
              type="number"
              min={0}
              required
              defaultValue={defaults.spots_left}
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Description"
        subtitle="A paragraph or two. What's the vibe? Who's this for?"
      >
        <textarea
          name="description"
          rows={6}
          defaultValue={defaults.description}
          placeholder="Tell joiners what to expect - pace, group size, level of comfort, anything that's a dealbreaker."
          className={`${inputCls} resize-y`}
        />
      </Section>

      <Section
        title="Photos"
        subtitle="Drop or pick photos from your device. The first one is the cover travellers see first."
      >
        <ImagesEditor images={images} onChange={setImages} accent="teal" />
      </Section>

      <Section
        title="What's included"
        subtitle="One per line. Shows up as a checklist on the public page."
      >
        <textarea
          name="includes"
          rows={5}
          defaultValue={defaults.includes.join("\n")}
          placeholder={"Hotel for 5 nights\nPetrol split 50:50\nAll group meals\nLocal guide"}
          className={`${inputCls} resize-y`}
        />
      </Section>

      <Section
        title="Tags"
        subtitle="Comma-separated. Helps travellers find your vibe."
      >
        <input
          name="tags"
          type="text"
          defaultValue={defaults.tags.join(", ")}
          placeholder="Mountains, Bikers, Adventure"
          className={inputCls}
        />
      </Section>

      <Section
        title="Day-by-day"
        subtitle="Sketch out each day. Add as much detail as you'd want to read if you were joining."
      >
        <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />
      </Section>

      <SubmitFooter mode={mode} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Submit footer - two intents (save draft vs submit for review)             */
/* -------------------------------------------------------------------------- */

function SubmitFooter({ mode }: { mode: "create" | "edit" }) {
  const [intent, setIntent] = useState<"draft" | "submit">("draft");

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:left-auto lg:right-0 lg:w-[calc(100%-15rem)] lg:px-8">
      <input type="hidden" name="intent" value={intent} />
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-xs text-stone-500">
          {intent === "submit" ? (
            <>
              <strong className="font-semibold text-ink">
                Submitting for review
              </strong>{" "}
              · admin reviews within 24 hours. You can&rsquo;t edit while
              it&rsquo;s pending.
            </>
          ) : (
            <>
              <strong className="font-semibold text-ink">Saving as draft</strong>{" "}
              · only you can see this. Edit any time.
            </>
          )}
        </div>
        <div className="flex gap-2">
          <SecondarySubmit
            onClick={() => setIntent("draft")}
            label={mode === "create" ? "Save draft" : "Save changes"}
            pendingLabel="Saving…"
          />
          <PrimarySubmit
            onClick={() => setIntent("submit")}
            label="Submit for review"
            pendingLabel="Submitting…"
          />
        </div>
      </div>
    </div>
  );
}

function PrimarySubmit({
  onClick,
  label,
  pendingLabel,
}: {
  onClick: () => void;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function SecondarySubmit({
  onClick,
  label,
  pendingLabel,
}: {
  onClick: () => void;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Dynamic itinerary list                                                     */
/* -------------------------------------------------------------------------- */

function ItineraryEditor({
  itinerary,
  onChange,
}: {
  itinerary: ItineraryDay[];
  onChange: (next: ItineraryDay[]) => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState<string | null>(null);

  function update(idx: number, patch: Partial<ItineraryDay>) {
    onChange(itinerary.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }
  function add() {
    onChange([
      ...itinerary,
      { day: itinerary.length + 1, title: "", description: "" },
    ]);
  }
  function remove(idx: number) {
    onChange(itinerary.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= itinerary.length) return;
    const next = [...itinerary];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  async function handleAiDraft() {
    setAiError(null);
    setAiLoading(true);

    // Read values from the nearest form
    const form = document.querySelector<HTMLFormElement>("form");
    const title    = (form?.querySelector<HTMLInputElement>('[name="title"]')?.value ?? "").trim();
    const location = (form?.querySelector<HTMLInputElement>('[name="location"]')?.value ?? "").trim();
    const days     = Number(form?.querySelector<HTMLInputElement>('[name="days"]')?.value ?? 5);
    const tags     = (form?.querySelector<HTMLInputElement>('[name="tags"]')?.value ?? "").trim();

    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location, days, tags }),
      });
      const data = await res.json() as { itinerary?: ItineraryDay[]; error?: string };
      if (!res.ok || !data.itinerary) {
        setAiError(data.error ?? "Generation failed. Try again.");
      } else {
        onChange(data.itinerary);
      }
    } catch {
      setAiError("Network error — check your connection and try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* AI draft button */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">
          Fill in the title, location, and days above first, then let AI sketch a draft.
        </p>
        <button
          type="button"
          onClick={handleAiDraft}
          disabled={aiLoading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {aiLoading ? (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" className="opacity-20" />
                <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
              </svg>
              Drafting…
            </>
          ) : (
            <>✨ AI Draft</>
          )}
        </button>
      </div>

      {aiError && (
        <div className="rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700 ring-1 ring-inset ring-red-200">
          {aiError}
        </div>
      )}

      {itinerary.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-sm text-stone-500">
          No days yet. Use AI Draft above or add your first day below.
        </div>
      )}
      {itinerary.map((day, idx) => (
        <div key={idx} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
              {idx + 1}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                placeholder="Day title (e.g. Manali to Sarchu, sleep under stars)"
                value={day.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                className={inputCls}
              />
              <textarea
                rows={2}
                placeholder="One or two sentences. What's the plan, where do you sleep, what's the food situation?"
                value={day.description}
                onChange={(e) => update(idx, { description: e.target.value })}
                className={`${inputCls} resize-y text-sm`}
              />
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <IconBtn label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)}>
                ↑
              </IconBtn>
              <IconBtn
                label="Move down"
                disabled={idx === itinerary.length - 1}
                onClick={() => move(idx, 1)}
              >
                ↓
              </IconBtn>
              <IconBtn label="Remove" onClick={() => remove(idx)}>
                ×
              </IconBtn>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex h-9 items-center rounded-full border border-dashed border-stone-300 px-4 text-xs font-medium text-stone-600 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
      >
        + Add day
      </button>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-md border border-stone-200 bg-white text-xs text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

const inputCls =
  "block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      <header>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
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
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </span>
      {hint && (
        <span className="mb-1.5 block text-xs text-stone-500">{hint}</span>
      )}
      {children}
    </label>
  );
}
