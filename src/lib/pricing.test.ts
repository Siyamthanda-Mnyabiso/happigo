import { describe, expect, it } from 'vitest';
import { calcOrderTotals } from './pricing';
import { formatRand } from './money';

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
