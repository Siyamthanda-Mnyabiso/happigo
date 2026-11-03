/**
 * Hand-written mirror of supabase/migrations (no Docker here to run `supabase gen types`).
 * supabase/tests/schema.test.ts fails if this drifts from the real migration, so keep them in sync,
 * or replace this file with `supabase gen types typescript --linked` once a project is linked.
 */

type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Insert needs `Req` columns; `Never` columns are database generated and can't be written. */
type Table<
  R,
  Req extends keyof R,
  Relationships extends Rel[] = [],
  Never extends keyof R = never,
> = {
  Row: R;
  Insert: Pick<R, Req> & Partial<Omit<R, Req | Never>>;
  Update: Partial<Omit<R, Never>>;
  Relationships: Relationships;
};

export type UserRole = 'customer' | 'restaurant' | 'driver' | 'admin';
export type PlanId = 'smb' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled';
export type OrderStatus =
  'new' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'declined' | 'cancelled';

type FK<N extends string, C extends string, T extends string, One extends boolean = false> = {
  foreignKeyName: N;
  columns: [C];
  isOneToOne: One;
  referencedRelation: T;
  referencedColumns: ['id'];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; role: UserRole; full_name: string | null; created_at: string },
        'id'
      >;
      restaurants: Table<
        { id: string; owner_id: string; name: string; created_at: string },
        'owner_id' | 'name',
        [FK<'restaurants_owner_id_fkey', 'owner_id', 'profiles'>]
      >;
      branches: Table<
        {
          id: string;
          restaurant_id: string;
          name: string;
          address: string | null;
          accepting_orders: boolean;
          created_at: string;
        },
        'restaurant_id' | 'name',
        [FK<'branches_restaurant_id_fkey', 'restaurant_id', 'restaurants'>]
      >;
      subscriptions: Table<
        {
          restaurant_id: string;
          plan: PlanId;
          status: SubscriptionStatus;
          next_billing_on: string | null;
          trial_ends_on: string | null;
          created_at: string;
        },
        'restaurant_id' | 'plan',
        [FK<'subscriptions_restaurant_id_fkey', 'restaurant_id', 'restaurants', true>]
      >;
      subscription_payments: Table<
        {
          id: string;
          restaurant_id: string;
          paid_on: string;
          amount_cents: number | null;
          status: string;
        },
        'restaurant_id' | 'paid_on',
        [FK<'subscription_payments_restaurant_id_fkey', 'restaurant_id', 'restaurants'>]
      >;
      bank_accounts: Table<
        {
          restaurant_id: string;
          bank: string;
          account_holder: string;
          account_last4: string;
          provider_recipient_ref: string | null;
          updated_at: string;
        },
        'restaurant_id' | 'bank' | 'account_holder' | 'account_last4',
        [FK<'bank_accounts_restaurant_id_fkey', 'restaurant_id', 'restaurants', true>]
      >;
      menu_items: Table<
        {
          id: string;
          branch_id: string;
          name: string;
          description: string | null;
          price_cents: number;
          available: boolean;
          popular: boolean;
        },
        'branch_id' | 'name' | 'price_cents',
        [FK<'menu_items_branch_id_fkey', 'branch_id', 'branches'>]
      >;
      orders: Table<
        {
          id: string;
          branch_id: string;
          customer_id: string | null;
          status: OrderStatus;
          food_cents: number;
          delivery_fee_cents: number;
          total_cents: number;
          created_at: string;
        },
        'branch_id' | 'food_cents' | 'delivery_fee_cents',
        [FK<'orders_branch_id_fkey', 'branch_id', 'branches'>],
        'total_cents'
      >;
      payouts: Table<
        {
          id: string;
          restaurant_id: string;
          amount_cents: number;
          paid_on: string;
          status: string;
        },
        'restaurant_id' | 'amount_cents' | 'paid_on',
        [FK<'payouts_restaurant_id_fkey', 'restaurant_id', 'restaurants'>]
      >;
    };
    Views: { [_ in never]: never };
    Functions: { owns_restaurant: { Args: { rid: string }; Returns: boolean } };
    Enums: {
      user_role: UserRole;
      plan_id: PlanId;
      subscription_status: SubscriptionStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type Tables = Database['public']['Tables'];

/**
 * Every column of every table, as the compiler sees it. `satisfies` makes TypeScript fail if a
 * column is missing here or doesn't exist in Row, and schema.test.ts compares this to the real
 * migration. So the types, this list and the SQL can't silently drift apart.
 */
export const COLUMNS = {
  profiles: { id: true, role: true, full_name: true, created_at: true },
  restaurants: { id: true, owner_id: true, name: true, created_at: true },
  branches: {
    id: true,
    restaurant_id: true,
    name: true,
    address: true,
    accepting_orders: true,
    created_at: true,
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
