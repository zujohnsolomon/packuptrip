import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getPlatformSettings,
  updatePlatformSetting,
} from "@/lib/supabase/queries";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Settings · Admin · Packuptrip" };
export const dynamic = "force-dynamic";

/** Human-readable config for each setting key */
const SETTING_META: Record<
  string,
  { label: string; description: string; unit: "%" | "×" | "integer"; decimals: number; min: number; max: number }
> = {
  service_fee_rate: {
    label: "Service fee rate",
    description: "Platform fee charged to travellers on each booking (e.g. 0.08 = 8%).",
    unit: "%",
    decimals: 4,
    min: 0,
    max: 1,
  },
  host_commission_rate: {
    label: "Host commission rate",
    description: "Platform cut deducted from host payout (e.g. 0.12 = 12%).",
    unit: "%",
    decimals: 4,
    min: 0,
    max: 1,
  },
  deposit_rate: {
    label: "Deposit rate",
    description: "Fraction of total collected upfront at booking (e.g. 0.20 = 20%).",
    unit: "%",
    decimals: 4,
    min: 0,
    max: 1,
  },
  min_group_size: {
    label: "Minimum group size",
    description: "Minimum number of confirmed joiners before a trip can go live.",
    unit: "integer",
    decimals: 0,
    min: 1,
    max: 100,
  },
};

function formatValue(key: string, value: number): string {
  const meta = SETTING_META[key];
  if (!meta) return String(value);
  if (meta.unit === "%") return `${(value * 100).toFixed(meta.decimals > 0 ? 1 : 0)}%`;
  return String(value);
}

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  async function saveSetting(formData: FormData) {
    "use server";
    const key = String(formData.get("key"));
    const raw = String(formData.get("value"));
    const value = parseFloat(raw);
    if (!isNaN(value)) {
      await updatePlatformSetting(key, value);
    }
    revalidatePath("/admin/settings");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin · Settings"
        title="Platform Settings"
        description="Configure fee rates and platform-wide rules. Changes take effect immediately on new bookings."
      />

      <div className="mx-auto max-w-3xl px-6 py-6 lg:px-8 lg:py-8">
        <div className="divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white shadow-[var(--shadow-card)]">
          {settings.length === 0 ? (
            <div className="py-16 text-center text-sm text-stone-400">
              No settings found. Check that the <code className="text-xs">platform_settings</code> table is seeded.
            </div>
          ) : (
            settings.map((s) => {
              const meta = SETTING_META[s.key];
              const displayLabel = meta?.label ?? s.key;
              const displayDescription = meta?.description ?? "";
              const inputStep = meta?.unit === "integer" ? "1" : "0.0001";
              const inputMin = String(meta?.min ?? 0);
              const inputMax = String(meta?.max ?? 9999);

              return (
                <div key={s.key} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:gap-8">
                  {/* Label column */}
                  <div className="sm:w-64 sm:shrink-0">
                    <div className="font-medium text-ink">{displayLabel}</div>
                    <div className="mt-1 text-xs text-stone-400">{displayDescription}</div>
                    <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-stone-300">
                      Last updated {new Date(s.updated_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Current value + edit form */}
                  <div className="flex flex-1 items-center gap-4">
                    <span className="text-xl font-semibold text-ink">
                      {formatValue(s.key, s.value)}
                    </span>
                    <form action={saveSetting} className="flex items-center gap-2">
                      <input type="hidden" name="key" value={s.key} />
                      <input
                        name="value"
                        type="number"
                        defaultValue={s.value}
                        step={inputStep}
                        min={inputMin}
                        max={inputMax}
                        className="w-28 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        aria-label={`New value for ${displayLabel}`}
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Store raw decimal values (0.08 for 8%). The UI shows formatted percentages for clarity.
          Changes apply immediately — there is no staging environment for settings.
        </p>
      </div>
    </>
  );
}
