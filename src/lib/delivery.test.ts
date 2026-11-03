import { describe, expect, it } from 'vitest';
import { distanceLabel, mapsLink, parsePeriod, periodStart, stageFor, summarise } from './delivery';

describe('stageFor', () => {
  it('maps each order status to a driver screen', () => {
    expect(stageFor('preparing')).toBe('to-restaurant');
    expect(stageFor('ready')).toBe('pickup');
    expect(stageFor('picked_up')).toBe('to-customer');
    expect(stageFor('delivered')).toBe('done');
    expect(stageFor('cancelled')).toBe('closed');
  });
});

describe('mapsLink', () => {
  it('encodes the address', () => {
    expect(mapsLink('12 Main Rd, Gardens')).toContain('destination=12%20Main%20Rd%2C%20Gardens');
    expect(mapsLink(null)).toBeNull();
  });
});

describe('distanceLabel', () => {
  it('formats or admits it is unknown', () => {
    expect(distanceLabel(3.24)).toBe('3.2 km');
    expect(distanceLabel(null)).toBe('Distance unknown');
  });
});

describe('periodStart', () => {
  // Tue 3 Nov 2026 14:30 in Cape Town
  const NOW = Date.parse('2026-11-03T12:30:00Z');
  it('starts today at midnight South African time', () => {
    expect(periodStart('today', NOW).toISOString()).toBe('2026-11-02T22:00:00.000Z');
  });
  it('starts the week on Monday', () => {
    expect(periodStart('week', NOW).toISOString()).toBe('2026-11-01T22:00:00.000Z');
  });
  it('starts the month on the 1st', () => {
    expect(periodStart('month', NOW).toISOString()).toBe('2026-10-31T22:00:00.000Z');
  });
  it('uses the local day just after midnight, not the UTC day', () => {
    const justAfterMidnight = Date.parse('2026-11-03T22:10:00Z'); // 00:10 on 4 Nov in Cape Town
    expect(periodStart('today', justAfterMidnight).toISOString()).toBe('2026-11-03T22:00:00.000Z');
  });
  it('defaults to today', () => {
    expect(parsePeriod('week')).toBe('week');
    expect(parsePeriod('x')).toBe('today');
  });
});

describe('summarise', () => {
  it('adds up pay, tips and trips', () => {
    expect(
      summarise([
        { driver_pay_cents: 2500, tip_cents: 1000 },
        { driver_pay_cents: 1500, tip_cents: 0 },
      ]),
    ).toEqual({
      total: 4000,
      tips: 1000,
      trips: 2,
    });
  });
});
