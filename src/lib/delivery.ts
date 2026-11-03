import type { OrderStatus } from './supabase/database.types';

/** Which screen a driver sees for a delivery they hold. */
export type Stage = 'to-restaurant' | 'pickup' | 'to-customer' | 'done' | 'closed';

export function stageFor(status: OrderStatus): Stage {
  switch (status) {
    case 'preparing':
      return 'to-restaurant';
    case 'ready':
      return 'pickup';
    case 'picked_up':
      return 'to-customer';
    case 'delivered':
      return 'done';
    default:
      return 'closed';
  }
}

/** Opens the phone's maps app with directions. Works on iOS and Android with no API key. */
export function mapsLink(address: string | null | undefined): string | null {
  if (!address) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function distanceLabel(km: number | null): string {
  return km === null ? 'Distance unknown' : `${km.toFixed(1)} km`;
}

export type Period = 'today' | 'week' | 'month';
export const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export function parsePeriod(v: string | undefined): Period {
  return PERIODS.find((p) => p.id === v)?.id ?? 'today';
}

/** Start of the period in UTC+2 (South Africa has no daylight saving). Weeks start on Monday. */
export function periodStart(period: Period, now: number): Date {
  const SAST = 2 * 3600 * 1000;
  const local = new Date(now + SAST);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let start = day;
  if (period === 'week') start = day - ((local.getUTCDay() + 6) % 7) * 86400000;
  if (period === 'month') start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return new Date(start - SAST);
}

/** Generated columns come back typed as nullable. Pay is fee plus tip, so a missing value is 0. */
export type Paid = { driver_pay_cents: number | null; tip_cents: number };

export function payOf(row: { driver_pay_cents: number | null }): number {
  return row.driver_pay_cents ?? 0;
}

export function summarise(rows: Paid[]) {
  const total = rows.reduce((n, r) => n + payOf(r), 0);
  const tips = rows.reduce((n, r) => n + r.tip_cents, 0);
  return { total, tips, trips: rows.length };
}
