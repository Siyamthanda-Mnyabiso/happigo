import { describe, expect, it } from 'vitest';
import { calcOrderTotals } from './pricing';
import { formatRand, parseRand, toRandInput } from './money';

describe('calcOrderTotals', () => {
  it('has no commission or service fee', () => {
    const t = calcOrderTotals({ food: 14300, deliveryFee: 1500 });
    expect(t.customerTotal).toBe(15800);
    expect(t.restaurantPayout).toBe(14300);
    expect(t.commission).toBe(0);
  });
  it('rejects fractional or negative cents', () => {
    expect(() => calcOrderTotals({ food: 10.5, deliveryFee: 0 })).toThrow(RangeError);
    expect(() => calcOrderTotals({ food: -1, deliveryFee: 0 })).toThrow(RangeError);
  });
});

describe('formatRand', () => {
  it('formats whole rands with a non-breaking thousands space', () => {
    expect(formatRand(184000)).toBe('R1 840');
    expect(formatRand(4800)).toBe('R48');
  });
  it('shows cents when needed', () => {
    expect(formatRand(4850)).toBe('R48.50');
  });
});

describe('parseRand', () => {
  it('reads common ways of typing a price', () => {
    expect(parseRand('15')).toBe(1500);
    expect(parseRand('15.5')).toBe(1550);
    expect(parseRand('R 1 200,50')).toBe(120050);
  });
  it('rejects anything else', () => {
    for (const bad of ['', 'abc', '-5', '1.234', '1,2,3']) expect(parseRand(bad), bad).toBeNull();
  });
  it('round trips with toRandInput', () => {
    expect(toRandInput(6500)).toBe('65.00');
    expect(parseRand(toRandInput(6550))).toBe(6550);
  });
});
