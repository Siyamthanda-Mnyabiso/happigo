import { describe, expect, it } from 'vitest';
import {
  ageLabel,
  formatCountdown,
  isPrepMinutes,
  itemCountLabel,
  minutesToReady,
  orderCode,
  parseTab,
  secondsLeft,
} from './orders';

const NOW = Date.parse('2026-11-03T12:00:00Z');

describe('orders helpers', () => {
  it('formats the countdown like the design', () => {
    expect(formatCountdown(165)).toBe('02:45');
    expect(formatCountdown(0)).toBe('00:00');
  });
  it('never goes below zero when the deadline has passed', () => {
    expect(secondsLeft('2026-11-03T11:00:00Z', NOW)).toBe(0);
    expect(secondsLeft('2026-11-03T12:02:45Z', NOW)).toBe(165);
    expect(secondsLeft(null, NOW)).toBe(0);
  });
  it('labels order age', () => {
    expect(ageLabel('2026-11-03T11:59:40Z', NOW)).toBe('just now');
    expect(ageLabel('2026-11-03T11:58:00Z', NOW)).toBe('2 min ago');
    expect(ageLabel('2026-11-03T09:00:00Z', NOW)).toBe('3 h ago');
  });
  it('only allows the four prep times', () => {
    expect([10, 15, 20, 30].every(isPrepMinutes)).toBe(true);
    expect(isPrepMinutes(12)).toBe(false);
    expect(isPrepMinutes('15')).toBe(false);
  });
  it('counts minutes until ready', () => {
    expect(minutesToReady('2026-11-03T11:55:00Z', 15, NOW)).toBe(10);
    expect(minutesToReady('2026-11-03T11:00:00Z', 15, NOW)).toBe(0);
    expect(minutesToReady(null, 15, NOW)).toBe(0);
  });
  it('falls back to the New tab', () => {
    expect(parseTab('ready')).toBe('ready');
    expect(parseTab('nope')).toBe('new');
    expect(parseTab(undefined)).toBe('new');
  });
  it('makes a short order code', () => {
    expect(orderCode('a1b2c3d4-0000-0000-0000-000000000000')).toBe('#A1B2C3');
  });
  it('pluralises items', () => {
    expect(itemCountLabel(1)).toBe('1 item');
    expect(itemCountLabel(3)).toBe('3 items');
  });
});
