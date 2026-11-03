-- Drivers: profiles, delivery assignment, and the rules for who may see and change what.
-- Driver pay is the delivery fee plus the tip (generated, so it can never drift from what the customer paid).
-- Customers pay total_cents + tip_cents.

alter table orders
  add column tip_cents integer not null default 0 check (tip_cents >= 0),
  add column driver_id uuid references profiles,
  add column driver_pay_cents integer generated always as (delivery_fee_cents + tip_cents) stored,
  add column delivery_instructions text,
  add column payment_method text not null default 'card' check (payment_method in ('card', 'cash')),
  add column delivery_lat double precision,
  add column delivery_lng double precision,
  add column picked_up_at timestamptz,
  add column delivered_at timestamptz;
create index on orders (driver_id, created_at desc);

alter table branches add column lat double precision, add column lng double precision;

create table driver_profiles (
  user_id uuid primary key references profiles on delete cascade,
  phone text,
  vehicle_type text check (vehicle_type in ('bike', 'scooter', 'car')),
  vehicle_model text,
  vehicle_plate text,
  is_online boolean not null default false,
  created_at timestamptz not null default now()
);
alter table driver_profiles enable row level security;
create policy "own driver profile" on driver_profiles for select using (user_id = (select auth.uid()));
create policy "own driver profile update" on driver_profiles for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Rows are created by the signup trigger only. Drivers edit these columns and nothing else.
grant select on driver_profiles to authenticated;
grant update (phone, vehicle_type, vehicle_model, vehicle_plate, is_online) on driver_profiles to authenticated;

create table delivery_declines (
  driver_id uuid not null references profiles on delete cascade,
  order_id uuid not null references orders on delete cascade,
  primary key (driver_id, order_id)
);
alter table delivery_declines enable row level security;
create policy "own declines" on delivery_declines for select using (driver_id = (select auth.uid()));
grant select on delivery_declines to authenticated;

-- Signup trigger now also creates the driver profile.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data ->> 'role';
begin
  insert into profiles (id, role, full_name)
  values (
    new.id,
    case when r in ('customer', 'restaurant', 'driver') then r::user_role else 'customer' end,
    new.raw_user_meta_data ->> 'full_name'
  );
  if r = 'driver' then
    insert into driver_profiles (user_id, phone) values (new.id, new.raw_user_meta_data ->> 'phone');
  end if;
  return new;
end $$;

-- What a driver may see: only deliveries assigned to them, plus the restaurant and items for those.
create function private.driver_sees_branch(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.orders where branch_id = bid and driver_id = (select auth.uid()))
$$;
create function private.driver_sees_restaurant(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o join public.branches b on b.id = o.branch_id
    where b.restaurant_id = rid and o.driver_id = (select auth.uid())
  )
$$;

drop policy "orders read" on orders;
create policy "orders read" on orders for select using (
  customer_id = (select auth.uid()) or driver_id = (select auth.uid()) or private.owns_branch(branch_id)
);

create or replace function private.can_see_order(oid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.id = oid
      and (o.customer_id = (select auth.uid()) or o.driver_id = (select auth.uid()) or private.owns_branch(o.branch_id))
  )
$$;

drop policy "owner branches" on branches;
create policy "branches read" on branches for select
  using (private.owns_restaurant(restaurant_id) or private.driver_sees_branch(id));
create policy "branches insert" on branches for insert with check (private.owns_restaurant(restaurant_id));
create policy "branches update" on branches for update
  using (private.owns_restaurant(restaurant_id)) with check (private.owns_restaurant(restaurant_id));
create policy "branches delete" on branches for delete using (private.owns_restaurant(restaurant_id));

drop policy "owner restaurants" on restaurants;
create policy "restaurants read" on restaurants for select
  using (owner_id = (select auth.uid()) or private.driver_sees_restaurant(id));
create policy "restaurants insert" on restaurants for insert with check (owner_id = (select auth.uid()));
create policy "restaurants update" on restaurants for update
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "restaurants delete" on restaurants for delete using (owner_id = (select auth.uid()));

-- Driver actions. Each one is a function so a driver can never write to orders directly.
create function private.require_driver() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid and role = 'driver') then
    raise exception 'Only drivers can do this' using errcode = '42501';
  end if;
  return uid;
end $$;

-- Unassigned orders show only what a driver needs to decide. Customer details unlock on accept.
create function driver_available_deliveries()
returns table (
  order_id uuid, restaurant_name text, pickup_address text, item_count integer,
  distance_km numeric, driver_pay_cents integer, tip_cents integer, status public.order_status
)
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := private.require_driver();
begin
  if not exists (select 1 from public.driver_profiles where user_id = uid and is_online) then
    return;
  end if;
  return query
    select o.id, r.name, b.address,
      coalesce((select sum(i.quantity)::integer from public.order_items i where i.order_id = o.id), 0),
      case when b.lat is null or o.delivery_lat is null then null else round((
        6371 * 2 * asin(sqrt(
          power(sin(radians(o.delivery_lat - b.lat) / 2), 2) +
          cos(radians(b.lat)) * cos(radians(o.delivery_lat)) * power(sin(radians(o.delivery_lng - b.lng) / 2), 2)
        )))::numeric, 1) end,
      o.driver_pay_cents, o.tip_cents, o.status
    from public.orders o
    join public.branches b on b.id = o.branch_id
    join public.restaurants r on r.id = b.restaurant_id
    where o.driver_id is null
      and o.status in ('preparing', 'ready')
      and not exists (select 1 from public.delivery_declines d where d.driver_id = uid and d.order_id = o.id)
    order by o.created_at;
end $$;

create function accept_delivery(oid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_driver();
begin
  if not exists (select 1 from public.driver_profiles where user_id = uid and is_online) then
    raise exception 'Go online to accept deliveries' using errcode = '23514';
  end if;
  if exists (select 1 from public.orders where driver_id = uid and status in ('preparing', 'ready', 'picked_up')) then
    raise exception 'Finish your current delivery first' using errcode = '23514';
  end if;
  -- One statement, so two drivers tapping at once can't both win.
  update public.orders set driver_id = uid
   where id = oid and driver_id is null and status in ('preparing', 'ready');
  if not found then
    raise exception 'Someone else already took this delivery' using errcode = '23514';
  end if;
end $$;

create function decline_delivery(oid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_driver();
begin
  insert into public.delivery_declines (driver_id, order_id) values (uid, oid) on conflict do nothing;
end $$;

create function mark_picked_up(oid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_driver();
begin
  update public.orders set status = 'picked_up', picked_up_at = now()
   where id = oid and driver_id = uid and status = 'ready';
  if not found then
    raise exception 'The restaurant has not marked this order ready yet' using errcode = '23514';
  end if;
end $$;

create function mark_delivered(oid uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid := private.require_driver();
begin
  update public.orders set status = 'delivered', delivered_at = now()
   where id = oid and driver_id = uid and status = 'picked_up';
  if not found then
    raise exception 'Pick the order up first' using errcode = '23514';
  end if;
end $$;

revoke execute on function driver_available_deliveries(), accept_delivery(uuid), decline_delivery(uuid),
  mark_picked_up(uuid), mark_delivered(uuid) from public, anon;
grant execute on function driver_available_deliveries(), accept_delivery(uuid), decline_delivery(uuid),
  mark_picked_up(uuid), mark_delivered(uuid) to authenticated;
