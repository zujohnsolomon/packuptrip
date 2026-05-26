/**
 * Packuptrip — pricing helpers.
 *
 * The definitive rates live in `platform_settings` (Supabase). The constants
 * below are compile-time fallbacks used only when the DB hasn't been queried
 * yet (e.g. static rendering, tests). At runtime all booking pages call
 * `getLivePricingRates()` to get the current admin-configured values.
 *
 * The `create_booking` RPC also reads from `platform_settings` directly,
 * so the displayed total always matches the stored total.
 */

// ─── Fallback constants (used for static/test contexts only) ─────────────────

export const SERVICE_FEE_RATE    = 0.08;
export const HOST_COMMISSION_RATE = 0.12;
export const BOOKING_DEPOSIT_RATE = 0.2;

// ─── Live rates from DB (call in server components / server actions) ──────────

export type PricingRates = {
  serviceFeeRate:    number;
  hostCommissionRate: number;
  depositRate:       number;
};

/**
 * Fetches current fee rates from `platform_settings`.
 * Falls back to the constants above if any key is missing.
 * Server-only — never call from client components.
 */
export async function getLivePricingRates(): Promise<PricingRates> {
  // Dynamic import keeps this file importable in client contexts too.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["service_fee_rate", "host_commission_rate", "deposit_rate"]);

  const map = Object.fromEntries(
    (data ?? []).map((r: { key: string; value: unknown }) => [r.key, Number(r.value)])
  );

  return {
    serviceFeeRate:    map["service_fee_rate"]    ?? SERVICE_FEE_RATE,
    hostCommissionRate: map["host_commission_rate"] ?? HOST_COMMISSION_RATE,
    depositRate:       map["deposit_rate"]         ?? BOOKING_DEPOSIT_RATE,
  };
}

// ─── Pure math helpers ────────────────────────────────────────────────────────

export function calcServiceFee(basePrice: number, rate = SERVICE_FEE_RATE): number {
  return Math.round(basePrice * rate);
}

export function calcBookingTotal(basePrice: number, rate = SERVICE_FEE_RATE): number {
  return basePrice + calcServiceFee(basePrice, rate);
}

export function calcDeposit(total: number, rate = BOOKING_DEPOSIT_RATE): number {
  return Math.round(total * rate);
}
