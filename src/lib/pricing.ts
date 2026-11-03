import type { Cents } from './money';

export type OrderTotals = {
  /** What the customer pays for the food. */
  food: Cents;
  /** Delivery fee, goes to the driver. */
  deliveryFee: Cents;
  /** food + deliveryFee. There is no service fee and no hidden platform charge. */
  customerTotal: Cents;
  /** Always the full food total. HappiGo takes no commission. */
  restaurantPayout: Cents;
  commission: 0;
};

export function calcOrderTotals(input: { food: Cents; deliveryFee: Cents }): OrderTotals {
  const { food, deliveryFee } = input;
  if (![food, deliveryFee].every((n) => Number.isInteger(n) && n >= 0)) {
    throw new RangeError('Amounts must be non-negative integer cents');
  }
  return {
    food,
    deliveryFee,
    customerTotal: food + deliveryFee,
    restaurantPayout: food,
    commission: 0,
  };
}
