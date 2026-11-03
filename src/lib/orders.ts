import type { OrderStatus } from './supabase/database.types';

export const PREP_OPTIONS = [10, 15, 20, 30] as const;
export type PrepMinutes = (typeof PREP_OPTIONS)[number];
export const DEFAULT_PREP: PrepMinutes = 15;

export function isPrepMinutes(n: unknown): n is PrepMinutes {
  return PREP_OPTIONS.includes(n as PrepMinutes);
}

export const TABS = [
  { id: 'new', label: 'New', status: 'new' },
  { id: 'preparing', label: 'Preparing', status: 'preparing' },
  { id: 'ready', label: 'Ready', status: 'ready' },
] as const satisfies readonly { id: string; label: string; status: OrderStatus }[];

export type OrderTab = (typeof TABS)[number]['id'];

export function parseTab(v: string | undefined): OrderTab {
  return TABS.find((t) => t.id === v)?.id ?? 'new';
}

/** "#A1B2C3". Short, readable, still unique enough to say over the phone. */
export function orderCode(id: string): string {
  return `#${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`;
}

export function secondsLeft(isoDeadline: string | null, now: number): number {
  if (!isoDeadline) return 0;
  return Math.max(0, Math.ceil((new Date(isoDeadline).getTime() - now) / 1000));
}

/** 165 -> "02:45" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ageLabel(isoCreated: string, now: number): string {
  const mins = Math.floor((now - new Date(isoCreated).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)} h ago`;
}

/** Minutes until the food should be ready, never below 0. */
export function minutesToReady(
  acceptedAt: string | null,
  prep: number | null,
  now: number,
): number {
  if (!acceptedAt || !prep) return 0;
  const readyAt = new Date(acceptedAt).getTime() + prep * 60000;
  return Math.max(0, Math.ceil((readyAt - now) / 60000));
}

export function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}
