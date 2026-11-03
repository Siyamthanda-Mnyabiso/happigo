-- HappiGo core schema. Money is integer cents (ZAR).
-- There is deliberately NO commission or service fee column anywhere.

create type user_role as enum ('customer', 'restaurant', 'driver', 'admin');
create type plan_id as enum ('smb', 'enterprise');
create type subscription_status as enum ('active', 'past_due', 'cancelled');
create type order_status as enum ('new', 'preparing', 'ready', 'picked_up', 'delivered', 'declined', 'cancelled');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now()
);

-- Signup trigger. The role comes from user metadata but 'admin' can never be self-assigned.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data ->> 'role';
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    case when r in ('customer', 'restaurant', 'driver') then r::user_role else 'customer' end,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index on restaurants (owner_id);

create table branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  name text not null,
  address text,
  accepting_orders boolean not null default false,
  created_at timestamptz not null default now()
);
create index on branches (restaurant_id);

create table subscriptions (
  restaurant_id uuid primary key references restaurants on delete cascade,
  plan plan_id not null,
  status subscription_status not null default 'active',
  next_billing_on date,
  trial_ends_on date,
  created_at timestamptz not null default now()
);

create table subscription_payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  paid_on date not null,
  amount_cents integer check (amount_cents >= 0), -- null until pricing is confirmed
  status text not null default 'paid'
);
create index on subscription_payments (restaurant_id, paid_on desc);

-- Never store the full account number. The provider (Paystack or Peach, TBC) holds it.
create table bank_accounts (
  restaurant_id uuid primary key references restaurants on delete cascade,
  bank text not null,
  account_holder text not null,
  account_last4 char(4) not null,
  provider_recipient_ref text,
  updated_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches on delete cascade,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  available boolean not null default true,
  popular boolean not null default false
);
create index on menu_items (branch_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches,
  customer_id uuid references profiles,
  status order_status not null default 'new',
  food_cents integer not null check (food_cents >= 0),
  delivery_fee_cents integer not null check (delivery_fee_cents >= 0),
  total_cents integer generated always as (food_cents + delivery_fee_cents) stored,
  created_at timestamptz not null default now()
);
create index on orders (branch_id, created_at desc);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  paid_on date not null,
  status text not null default 'paid'
);
create index on payouts (restaurant_id, paid_on desc);

-- Row level security
create function owns_restaurant(rid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from restaurants where id = rid and owner_id = auth.uid())
$$;

alter table profiles enable row level security;
alter table restaurants enable row level security;
alter table branches enable row level security;
alter table subscriptions enable row level security;
alter table subscription_payments enable row level security;
alter table bank_accounts enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table payouts enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "owner restaurants" on restaurants for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner branches" on branches for all
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));
create policy "owner subscription read" on subscriptions for select using (owns_restaurant(restaurant_id));
create policy "owner subscription write" on subscriptions for insert with check (owns_restaurant(restaurant_id));
create policy "owner subscription change" on subscriptions for update
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));
create policy "owner payments read" on subscription_payments for select using (owns_restaurant(restaurant_id));
create policy "owner bank" on bank_accounts for all
  using (owns_restaurant(restaurant_id)) with check (owns_restaurant(restaurant_id));
create policy "owner payouts read" on payouts for select using (owns_restaurant(restaurant_id));
create policy "owner menu" on menu_items for all
  using (owns_restaurant((select restaurant_id from branches b where b.id = branch_id)))
  with check (owns_restaurant((select restaurant_id from branches b where b.id = branch_id)));
create policy "public menu read" on menu_items for select using (available);
create policy "owner orders read" on orders for select
  using (owns_restaurant((select restaurant_id from branches b where b.id = branch_id)));
create policy "owner orders update" on orders for update
  using (owns_restaurant((select restaurant_id from branches b where b.id = branch_id)))
  with check (owns_restaurant((select restaurant_id from branches b where b.id = branch_id)));
create policy "customer own orders" on orders for select using (customer_id = auth.uid());

-- Restaurants may only change an order's status, never its amounts.
revoke update on orders from authenticated;
grant update (status) on orders to authenticated;
