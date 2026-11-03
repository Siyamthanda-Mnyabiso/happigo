import type { OrderStatus } from './supabase/database.types';

/** What the customer sees for each order status, in plain words. */
export const STATUS_COPY: Record<OrderStatus, { title: string; detail: string; step: number }> = {
  new: {
    title: 'Waiting for the restaurant',
    detail: 'They have a few minutes to accept.',
    step: 0,
  },
  preparing: { title: 'Being prepared', detail: 'The restaurant is making your food.', step: 1 },
  ready: { title: 'Ready for pickup', detail: 'Waiting for a driver to collect it.', step: 2 },
  picked_up: { title: 'On the way', detail: 'Your driver has your food.', step: 3 },
  delivered: { title: 'Delivered', detail: 'Enjoy your meal.', step: 4 },
  declined: {
    title: 'Not accepted',
    detail: 'The restaurant could not take this order. You were not charged.',
    step: -1,
  },
  cancelled: { title: 'Cancelled', detail: 'This order was cancelled.', step: -1 },
};

export const STEPS = ['Placed', 'Preparing', 'Ready', 'On the way', 'Delivered'] as const;

export function isActive(status: OrderStatus): boolean {
  return !['delivered', 'declined', 'cancelled'].includes(status);
}
