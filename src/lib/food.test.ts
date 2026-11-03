import { describe, expect, it } from 'vitest';
import { emojiFor, tintFor } from './food';

describe('food visuals', () => {
  it('picks an emoji from the cuisine or category', () => {
    expect(emojiFor('Burgers')).toBe('🍔');
    expect(emojiFor('Indian curry house')).toBe('🍛');
    expect(emojiFor('Drinks')).toBe('🥤');
  });
  it('falls back to a plate', () => {
    expect(emojiFor(null)).toBe('🍽️');
    expect(emojiFor('Something new')).toBe('🍽️');
  });
  it('gives the same tint for the same name', () => {
    expect(tintFor('Test Burger Joint')).toBe(tintFor('Test Burger Joint'));
  });
});
