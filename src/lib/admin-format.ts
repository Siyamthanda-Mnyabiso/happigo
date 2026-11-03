import type { OrderStatus } from './supabase/database.types';

export type Tone = 'ok' | 'warn' | 'danger' | 'neutral';

const ZA = 'Africa/Johannesburg';

/** "14:32" for today, "3 Nov" for anything else. Times are South African time. */
export function whenLabel(iso: string | null, now: number = Date.now()): string {
  if (!iso) return 'None yet';
  const d = new Date(iso);
  const day = (x: Date | number) =>
    new Intl.DateTimeFormat('en-ZA', { timeZone: ZA, dateStyle: 'short' }).format(x);
  if (day(d) === day(now)) {
    return new Intl.DateTimeFormat('en-ZA', {
      timeZone: ZA,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  }
  return new Intl.DateTimeFormat('en-ZA', { timeZone: ZA, day: 'numeric', month: 'short' }).format(
    d,
  );
}

export function dateLabel(iso: string | null): string {
  if (!iso) return 'None yet';
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: ZA,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export const RESTAURANT_STATUS: Record<string, { label: string; tone: Tone }> = {
  live: { label: 'Live', tone: 'ok' },
  no_bank: { label: 'No bank account', tone: 'warn' },
  no_plan: { label: 'No plan chosen', tone: 'warn' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

export const DRIVER_STATUS: Record<string, { label: string; tone: Tone }> = {
  online: { label: 'Online', tone: 'ok' },
  on_delivery: { label: 'On a delivery', tone: 'warn' },
  offline: { label: 'Offline', tone: 'neutral' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'warn' },
  preparing: { label: 'Preparing', tone: 'warn' },
  ready: { label: 'Ready', tone: 'warn' },
  picked_up: { label: 'On the way', tone: 'warn' },
  delivered: { label: 'Delivered', tone: 'ok' },
  declined: { label: 'Declined', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const PLAN_LABEL: Record<string, string> = { smb: 'SMB', enterprise: 'Enterprise' };

/** Only plain strings may be used as a tab or filter from the address bar. */
export function pick<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((a) => a === value) ?? fallback;
}
