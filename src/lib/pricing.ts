/**
 * Packuptrip - locked pricing constants.
 *
 * Single source of truth for fees, commissions, and deposit %. Imported by
 * every UI surface that displays them.
 *
 * ⚠️  THE BOOKING RPC `public.create_booking` HAS ITS OWN COPY of
 *     `v_fee_rate` because SQL functions can't import from TS. If you change
 *     SERVICE_FEE_RATE here, you MUST also issue a migration that updates the
 *     RPC. Both numbers must match or the displayed total won't equal the
 *     stored total.
 *
 * Until T9.12 (Platform Settings, post-launch) ships, these are hardcoded.
 * After T9.12 they move into a `platform_settings` table and admins can
 * tune them live.
 *
 * Last locked: 23 May 2026 by the founder.
 */

/** Charged on every booking. Shown as a line item in the price breakdown. */
export const SERVICE_FEE_RATE = 0.08;

/** Taken from the host's payout on community trips. Not yet applied
 *  anywhere - wired up in Epic 7 (Payments) when payout splits land. */
export const HOST_COMMISSION_RATE = 0.12;

/** Upfront deposit collected at booking time. The remaining balance is
 *  charged before the trip starts. Logic lives in Epic 7 (Payments). */
export const BOOKING_DEPOSIT_RATE = 0.2;

/** Convenience helpers - single rounding rule (nearest rupee) so display
 *  always matches the RPC's `round()` of service fee. */
export function calcServiceFee(basePrice: number): number {
  return Math.round(basePrice * SERVICE_FEE_RATE);
}

export function calcBookingTotal(basePrice: number): number {
  return basePrice + calcServiceFee(basePrice);
}

export function calcDeposit(total: number): number {
  return Math.round(total * BOOKING_DEPOSIT_RATE);
}
