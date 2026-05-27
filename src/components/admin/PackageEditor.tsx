"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagesEditor } from "@/components/shared/ImagesEditor";
import type { ItineraryDay, PackageStatus } from "@/types/db";

export type PackageEditorDefaults = {
  id?: string;
  title: string;
  location: string;
  description: string;
  days: number;
  price: number;
  start_date: string; // ISO yyyy-MM-dd
  spots_total: number;
  spots_left: number;
  status: PackageStatus;
  images: string[];
  itinerary: ItineraryDay[];
  tags: string[];
  includes: string[];
};

export const blankPackage: PackageEditorDefaults = {
  title: "",
  location: "",
  description: "",
  days: 5,
  price: 0,
  start_date: "",
  spots_total: 10,
  spots_left: 10,
  status: "draft",
  images: [],
  itinerary: [],
  tags: [],
  includes: [],
};

export function PackageEditor({
  defaults,
  action,
  submitLabel,
  pendingLabel,
  mode,
}: {
  defaults: PackageEditorDefaults;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  pendingLabel: string;
  mode: "create" | "edit";
}) {
  // Dynamic state for images + itinerary; serialised to hidden inputs.
  const [images, setImages] = useState<string[]>(defaults.images);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(
    defaults.itinerary.length > 0 ? defaults.itinerary : [],
  );

  return (
    <form action={action} className="space-y-8">
      {defaults.id && (
        <input type="hidden" name="id" value={defaults.id} />
      )}
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

      {/* Basics */}
      <Section title="Basics" subtitle="The headline info travellers see first.">
        <Field label="Title">
          <input
            name="title"
            type="text"
            required
            defaultValue={defaults.title}
            className={inputCls}
          />
        </Field>
        <Field label="Location">
          <input
            name="location"
            type="text"
            required
            defaultValue={defaults.location}
            placeholder="e.g. Spiti Valley, Himachal Pradesh"
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
          <Field label="Price (₹)" hint="Per person.">
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={defaults.price}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Spots total">
            <input
              name="spots_total"
              type="number"
              min={1}
              required
              defaultValue={defaults.spots_total}
              className={inputCls}
            />
          </Field>
          <Field label="Spots left" hint="Reduces automatically as travellers book.">
            <input
              name="spots_left"
              type="number"
              min={0}
              required
              defaultValue={defaults.spots_left}
              className={inputCls}
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={defaults.status}
              className={inputCls}
            >
              <option value="draft">Draft (not visible)</option>
              <option value="live">Live (publicly listed)</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Description */}
      <Section title="Description" subtitle="Short pitch on the detail page.">
        <textarea
          name="description"
          rows={5}
          defaultValue={defaults.description}
          className={`${inputCls} resize-y`}
          placeholder="Two paragraphs max. What kind of traveller is this for? What's the feel?"
        />
      </Section>

      {/* Images */}
      <Section
        title="Images"
        subtitle="Drop or pick photos from your device. First one is the hero shown everywhere."
      >
        <ImagesEditor images={images} onChange={setImages} accent="amber" />
      </Section>

      {/* Includes */}
      <Section
        title="What's included"
        subtitle="One per line. Show up as a checklist on the detail page."
      >
        <textarea
          name="includes"
          rows={5}
          defaultValue={defaults.includes.join("\n")}
          className={`${inputCls} resize-y`}
          placeholder={"Hotel for 5 nights\nAll breakfasts\nLocal guide\nPermits"}
        />
      </Section>

      {/* Tags */}
      <Section title="Tags" subtitle="Comma-separated. Help travellers find the right vibe.">
        <input
          name="tags"
          type="text"
          defaultValue={defaults.tags.join(", ")}
          placeholder="Mountains, Small group, Slow travel"
          className={inputCls}
        />
      </Section>

      {/* Itinerary */}
      <Section
        title="Day-by-day"
        subtitle="Add a row per day. Day numbers renumber automatically as you reorder or remove."
      >
        <ItineraryEditor itinerary={itinerary} onChange={setItinerary} />
      </Section>

      <div className="sticky bottom-0 -mx-6 border-t border-stone-200 bg-white px-6 py-4 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-end gap-3">
          <a
            href={defaults.id ? `/admin/originals/${defaults.id}` : "/admin/originals"}
            className="text-sm font-medium text-stone-600 hover:text-ink"
          >
            Cancel
          </a>
          <SaveButton submitLabel={submitLabel} pendingLabel={pendingLabel} />
        </div>
        <p className="mt-2 text-right text-xs text-stone-500">
          {mode === "create"
            ? "Will be created with the status you picked above."
            : "Saving updates the published listing immediately if status = Live."}
        </p>
      </div>
    </form>
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
  function update(idx: number, patch: Partial<ItineraryDay>) {
    onChange(
      itinerary.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    );
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

  return (
    <div className="space-y-3">
      {itinerary.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center text-sm text-stone-500">
          No itinerary yet. Add the first day below.
        </div>
      )}
      {itinerary.map((day, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-stone-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-yellow-100 text-xs font-semibold text-yellow-500">
              {idx + 1}
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                placeholder="Day title (e.g. Manali to Kaza via Atal Tunnel)"
                value={day.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                className={inputCls}
              />
              <textarea
                rows={2}
                placeholder="One or two sentences. What happens this day?"
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
        className="inline-flex h-9 items-center rounded-full border border-dashed border-stone-300 px-4 text-xs font-medium text-stone-600 hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-500"
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
/* Submit                                                                     */
/* -------------------------------------------------------------------------- */

function SaveButton({
  submitLabel,
  pendingLabel,
}: {
  submitLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-yellow-400 px-6 text-sm font-semibold text-stone-900 shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : submitLabel}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared field helpers                                                       */
/* -------------------------------------------------------------------------- */

const inputCls =
  "block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-ink placeholder-stone-400 shadow-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-100";

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
