import type { OrderStatus } from './supabase/database.types';

/** What the customer sees for each order status, in plain words. */
export const STATUS_COPY: Record<
  OrderStatus,
  { title: string; short: string; detail: string; step: number }
> = {
  new: {
    short: 'Waiting',
    title: 'Waiting for the restaurant',
    detail: 'They have a few minutes to accept.',
    step: 0,
  },
  preparing: {
    short: 'Preparing',
    title: 'Being prepared',
    detail: 'The restaurant is making your food.',
    step: 1,
  },
  ready: {
    short: 'Ready',
    title: 'Ready for pickup',
    detail: 'Waiting for a driver to collect it.',
    step: 2,
  },
  picked_up: {
    short: 'On the way',
    title: 'On the way',
    detail: 'Your driver has your food.',
    step: 3,
  },
  delivered: { short: 'Delivered', title: 'Delivered', detail: 'Enjoy your meal.', step: 4 },
  declined: {
    short: 'Not accepted',
    title: 'Not accepted',
    detail: 'The restaurant could not take this order. You were not charged.',
    step: -1,
  },
  cancelled: {
    short: 'Cancelled',
    title: 'Cancelled',
    detail: 'This order was cancelled.',
    step: -1,
  },
};

/** The four stages in the design's progress bar, and how many are lit for each status. */
export const STEPS = ['Confirmed', 'Preparing', 'On the way', 'Delivered'] as const;
export const LIT: Record<OrderStatus, number> = {
  new: 0,
  preparing: 2,
  ready: 2,
  picked_up: 3,
  delivered: 4,
  declined: 0,
  cancelled: 0,
};

export function isActive(status: OrderStatus): boolean {
  return !['delivered', 'declined', 'cancelled'].includes(status);
}
