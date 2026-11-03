/**
 * Types come from the live database: `npm run db:types` regenerates database.generated.ts.
 * COLUMNS and ENUMS below are checked by the compiler against it, and supabase/tests/schema.test.ts
 * checks them against the migrations, so the SQL, the types and these lists can't drift apart.
 */
import type { Database } from './database.generated';

export type { Database };
export type UserRole = Database['public']['Enums']['user_role'];
export type PlanId = Database['public']['Enums']['plan_id'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
export type OrderStatus = Database['public']['Enums']['order_status'];

type Tables = Database['public']['Tables'];

/**
 * Every column of every table, as the compiler sees it. `satisfies` makes TypeScript fail if a
 * column is missing here or doesn't exist in Row, and schema.test.ts compares this to the real
 * migration. So the types, this list and the SQL can't silently drift apart.
 */
export const COLUMNS = {
  profiles: { id: true, role: true, full_name: true, created_at: true },
  restaurants: {
    id: true,
    owner_id: true,
    name: true,
    created_at: true,
    cuisine: true,
    delivery_fee_cents: true,
    image_url: true,
  },
  branches: {
    id: true,
    restaurant_id: true,
    name: true,
    address: true,
    accepting_orders: true,
    created_at: true,
    lat: true,
    lng: true,
  },
  subscriptions: {
    restaurant_id: true,
    plan: true,
    status: true,
    next_billing_on: true,
    trial_ends_on: true,
    created_at: true,
  },
  subscription_payments: {
    id: true,
    restaurant_id: true,
    paid_on: true,
    amount_cents: true,
    status: true,
  },
  bank_accounts: {
    restaurant_id: true,
    bank: true,
    account_holder: true,
    account_last4: true,
    provider_recipient_ref: true,
    updated_at: true,
  },
  menu_items: {
    id: true,
    branch_id: true,
    name: true,
    description: true,
    price_cents: true,
    available: true,
    popular: true,
    category: true,
    image_url: true,
  },
  orders: {
    id: true,
    branch_id: true,
    customer_id: true,
    status: true,
    food_cents: true,
    delivery_fee_cents: true,
    total_cents: true,
    created_at: true,
    customer_name: true,
    delivery_address: true,
    note: true,
    prep_minutes: true,
    respond_by: true,
    accepted_at: true,
    tip_cents: true,
    driver_id: true,
    driver_pay_cents: true,
    delivery_instructions: true,
    payment_method: true,
    delivery_lat: true,
    delivery_lng: true,
    picked_up_at: true,
    delivered_at: true,
    payment_status: true,
  },
  driver_profiles: {
    user_id: true,
    phone: true,
    vehicle_type: true,
    vehicle_model: true,
    vehicle_plate: true,
    is_online: true,
    created_at: true,
  },
  delivery_declines: { driver_id: true, order_id: true },
  customer_addresses: { id: true, user_id: true, label: true, address: true, created_at: true },
  order_items: {
    id: true,
    order_id: true,
    name: true,
    options: true,
    quantity: true,
    unit_price_cents: true,
  },
  payouts: { id: true, restaurant_id: true, amount_cents: true, paid_on: true, status: true },
} satisfies { [T in keyof Tables]: Record<keyof Tables[T]['Row'], true> };

export const ENUMS = {
  user_role: ['customer', 'restaurant', 'driver', 'admin'],
  plan_id: ['smb', 'enterprise'],
  subscription_status: ['active', 'past_due', 'cancelled'],
  order_status: ['new', 'preparing', 'ready', 'picked_up', 'delivered', 'declined', 'cancelled'],
} as const satisfies {
  [E in keyof Database['public']['Enums']]: readonly Database['public']['Enums'][E][];
};
