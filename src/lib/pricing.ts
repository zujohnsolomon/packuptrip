/**
 * Packuptrip — pricing constants and pure math helpers.
 *
 * This file is CLIENT-SAFE — no server imports. It is imported by
 * BookingForm and other client components.
 *
 * The definitive rates live in `platform_settings` (Supabase). The constants
 * below are compile-time fallbacks. Server pages call `getLivePricingRates()`
 * from `@/lib/supabase/queries` to get the current admin-configured values.
 *
 * The `create_booking` RPC also reads from `platform_settings` directly,
 * so the displayed total always matches the stored total.
 */

// ─── Fallback constants ───────────────────────────────────────────────────────

export const SERVICE_FEE_RATE     = 0.08;
export const HOST_COMMISSION_RATE = 0.12;
export const BOOKING_DEPOSIT_RATE = 0.2;

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
