-- Admin: HappiGo staff view everything and can suspend restaurants and drivers or cancel an order.
-- Everything goes through security definer functions that check the caller is an admin, so no
-- service-role key is needed and no table policy is widened. Admins are created by hand (see README).

-- Suspensions live in their own table so a restaurant owner or driver can read theirs but never lift it.
create table suspensions (
  subject_id uuid primary key,
  kind text not null check (kind in ('restaurant', 'driver')),
  created_at timestamptz not null default now()
);
alter table suspensions enable row level security;
create policy "own suspension" on suspensions for select
  using (subject_id = (select auth.uid()) or private.owns_restaurant(subject_id));
grant select on suspensions to authenticated;

create function private.is_suspended(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suspensions where subject_id = sid)
$$;

-- A suspended restaurant is not listed, so customers cannot order from it.
create or replace function private.restaurant_is_listed(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.subscriptions s where s.restaurant_id = rid and s.status = 'active')
     and exists (select 1 from public.bank_accounts b where b.restaurant_id = rid)
     and exists (select 1 from public.branches br where br.restaurant_id = rid)
     and not exists (select 1 from public.suspensions x where x.subject_id = rid)
$$;

-- A suspended driver cannot take or change deliveries.
create or replace function private.require_driver() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid and role = 'driver') then
    raise exception 'Only drivers can do this' using errcode = '42501';
  end if;
  if exists (select 1 from public.suspensions where subject_id = uid) then
    raise exception 'Your account is suspended. Contact HappiGo support' using errcode = '23514';
  end if;
  return uid;
end $$;

create function private.require_admin() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid and role = 'admin') then
    raise exception 'Only HappiGo staff can do this' using errcode = '42501';
  end if;
  return uid;
end $$;

-- Lets the web app ask "am I an admin?" without raising.
create function is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
$$;

-- Overview numbers. "Today" is the calendar day in South Africa.
create function admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  start_of_day timestamptz := date_trunc('day', now() at time zone 'Africa/Johannesburg') at time zone 'Africa/Johannesburg';
begin
  perform private.require_admin();
  return jsonb_build_object(
    'orders_today', (select count(*) from public.orders where created_at >= start_of_day),
    'food_today_cents', (select coalesce(sum(food_cents), 0) from public.orders
                          where created_at >= start_of_day and status <> all (array['declined', 'cancelled']::public.order_status[])),
    'restaurants_live', (select count(*) from public.restaurants r where private.restaurant_is_listed(r.id)),
    'drivers_online', (select count(*) from public.driver_profiles d
                        where d.is_online and not private.is_suspended(d.user_id)),
    'unanswered_orders', (select count(*) from public.orders
                           where status = 'new' and created_at < now() - interval '5 minutes'),
    'restaurants_not_live', (select count(*) from public.restaurants r
                              where not private.restaurant_is_listed(r.id) and not private.is_suspended(r.id)),
    'ready_without_driver', (select count(*) from public.orders
                              where status = 'ready' and driver_id is null and created_at < now() - interval '10 minutes')
  );
end $$;

create function admin_restaurants()
returns table (
  id uuid, name text, cuisine text, plan text, status text, orders_this_month bigint, joined timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return query
    select r.id, r.name, r.cuisine, s.plan::text,
      case
        when private.is_suspended(r.id) then 'suspended'
        when private.restaurant_is_listed(r.id) then 'live'
        when s.restaurant_id is null or s.status <> 'active' then 'no_plan'
        else 'no_bank'
      end,
      (select count(*) from public.orders o join public.branches b on b.id = o.branch_id
        where b.restaurant_id = r.id and o.created_at >= date_trunc('month', now())),
      r.created_at
    from public.restaurants r
    left join public.subscriptions s on s.restaurant_id = r.id
    order by r.created_at desc;
end $$;

create function admin_restaurant(rid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_admin();
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'cuisine', r.cuisine,
    'owner_name', p.full_name,
    'owner_email', u.email,
    'address', (select b.address from public.branches b where b.restaurant_id = r.id order by b.created_at limit 1),
    'accepting_orders', coalesce((select bool_or(b.accepting_orders) from public.branches b where b.restaurant_id = r.id), false),
    'plan', s.plan,
    'next_billing_on', s.next_billing_on,
    'bank', (select b.bank || ' ending ' || b.account_last4 from public.bank_accounts b where b.restaurant_id = r.id),
    'delivery_fee_cents', r.delivery_fee_cents,
    'suspended', private.is_suspended(r.id),
    'live', private.restaurant_is_listed(r.id),
    'orders_this_month', (select count(*) from public.orders o join public.branches b on b.id = o.branch_id
                           where b.restaurant_id = r.id and o.created_at >= date_trunc('month', now())),
    'food_this_month_cents', (select coalesce(sum(o.food_cents), 0) from public.orders o join public.branches b on b.id = o.branch_id
                               where b.restaurant_id = r.id and o.status = 'delivered' and o.created_at >= date_trunc('month', now()))
  ) into result
  from public.restaurants r
  join public.profiles p on p.id = r.owner_id
  left join auth.users u on u.id = r.owner_id
  left join public.subscriptions s on s.restaurant_id = r.id
  where r.id = rid;
  if result is null then
    raise exception 'Restaurant not found' using errcode = '23514';
  end if;
  return result;
end $$;

create function admin_set_restaurant_suspended(rid uuid, suspend boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not exists (select 1 from public.restaurants where id = rid) then
    raise exception 'Restaurant not found' using errcode = '23514';
  end if;
  if suspend then
    insert into public.suspensions (subject_id, kind) values (rid, 'restaurant') on conflict do nothing;
  else
    delete from public.suspensions where subject_id = rid and kind = 'restaurant';
  end if;
end $$;

create function admin_drivers()
returns table (
  id uuid, name text, phone text, vehicle text, status text, deliveries_this_month bigint, earned_this_month_cents bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return query
    select d.user_id, p.full_name, d.phone,
      nullif(trim(concat_ws(' ', d.vehicle_model, d.vehicle_plate)), ''),
      case
        when private.is_suspended(d.user_id) then 'suspended'
        when exists (select 1 from public.orders o where o.driver_id = d.user_id and o.status in ('preparing', 'ready', 'picked_up')) then 'on_delivery'
        when d.is_online then 'online'
        else 'offline'
      end,
      (select count(*) from public.orders o where o.driver_id = d.user_id and o.status = 'delivered'
         and o.delivered_at >= date_trunc('month', now())),
      (select coalesce(sum(o.driver_pay_cents), 0)::bigint from public.orders o where o.driver_id = d.user_id and o.status = 'delivered'
         and o.delivered_at >= date_trunc('month', now()))
    from public.driver_profiles d
    join public.profiles p on p.id = d.user_id
    order by p.full_name nulls last;
end $$;

create function admin_set_driver_suspended(uid uuid, suspend boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not exists (select 1 from public.driver_profiles where user_id = uid) then
    raise exception 'Driver not found' using errcode = '23514';
  end if;
  if suspend then
    insert into public.suspensions (subject_id, kind) values (uid, 'driver') on conflict do nothing;
    update public.driver_profiles set is_online = false where user_id = uid;
  else
    delete from public.suspensions where subject_id = uid and kind = 'driver';
  end if;
end $$;

-- Orders. search matches the order code (first 6 characters of the id) or the customer name.
create function admin_orders(search text default null, filter text default 'all')
returns table (
  id uuid, restaurant_name text, customer_name text, driver_name text,
  total_cents integer, status public.order_status, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
declare term text := nullif(trim(coalesce(search, '')), '');
begin
  perform private.require_admin();
  return query
    select o.id, r.name, o.customer_name, dp.full_name, o.total_cents, o.status, o.created_at
    from public.orders o
    join public.branches b on b.id = o.branch_id
    join public.restaurants r on r.id = b.restaurant_id
    left join public.profiles dp on dp.id = o.driver_id
    where (term is null
        or replace(o.id::text, '-', '') ilike replace(ltrim(term, '#'), '-', '') || '%'
        or o.customer_name ilike '%' || term || '%')
      and case filter
        when 'new' then o.status = 'new'
        when 'progress' then o.status in ('preparing', 'ready', 'picked_up')
        when 'delivered' then o.status = 'delivered'
        when 'cancelled' then o.status in ('cancelled', 'declined')
        else true end
    order by o.created_at desc
    limit 200;
end $$;

create function admin_order(oid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_admin();
  select jsonb_build_object(
    'id', o.id,
    'status', o.status,
    'created_at', o.created_at,
    'accepted_at', o.accepted_at,
    'prep_minutes', o.prep_minutes,
    'picked_up_at', o.picked_up_at,
    'delivered_at', o.delivered_at,
    'customer_name', o.customer_name,
    'customer_email', u.email,
    'delivery_address', o.delivery_address,
    'note', o.note,
    'restaurant_name', r.name,
    'restaurant_address', b.address,
    'driver_name', dp.full_name,
    'driver_phone', d.phone,
    'food_cents', o.food_cents,
    'delivery_fee_cents', o.delivery_fee_cents,
    'tip_cents', o.tip_cents,
    'paid_cents', o.total_cents + o.tip_cents,
    'payment_method', o.payment_method,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('name', i.name, 'options', i.options, 'quantity', i.quantity,
                                          'unit_price_cents', i.unit_price_cents) order by i.name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  ) into result
  from public.orders o
  join public.branches b on b.id = o.branch_id
  join public.restaurants r on r.id = b.restaurant_id
  left join auth.users u on u.id = o.customer_id
  left join public.profiles dp on dp.id = o.driver_id
  left join public.driver_profiles d on d.user_id = o.driver_id
  where o.id = oid;
  if result is null then
    raise exception 'Order not found' using errcode = '23514';
  end if;
  return result;
end $$;

-- Cancelling goes through the same status trigger as everything else, so only live orders can be cancelled.
create function admin_cancel_order(oid uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not exists (select 1 from public.orders where id = oid) then
    raise exception 'Order not found' using errcode = '23514';
  end if;
  update public.orders set status = 'cancelled' where id = oid and status in ('new', 'preparing', 'ready');
  if not found then
    raise exception 'This order can no longer be cancelled' using errcode = '23514';
  end if;
end $$;

create function admin_customers()
returns table (
  id uuid, name text, email text, orders bigint, spent_cents bigint, last_order timestamptz, joined timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin();
  return query
    select p.id, p.full_name, u.email,
      (select count(*) from public.orders o where o.customer_id = p.id),
      (select coalesce(sum(o.food_cents), 0)::bigint from public.orders o
        where o.customer_id = p.id and o.status = 'delivered'),
      (select max(o.created_at) from public.orders o where o.customer_id = p.id),
      p.created_at
    from public.profiles p
    left join auth.users u on u.id = p.id
    where p.role = 'customer'
    order by p.created_at desc
    limit 500;
end $$;

revoke execute on function is_admin(), admin_overview(), admin_restaurants(), admin_restaurant(uuid),
  admin_set_restaurant_suspended(uuid, boolean), admin_drivers(), admin_set_driver_suspended(uuid, boolean),
  admin_orders(text, text), admin_order(uuid), admin_cancel_order(uuid), admin_customers() from public, anon;
grant execute on function is_admin(), admin_overview(), admin_restaurants(), admin_restaurant(uuid),
  admin_set_restaurant_suspended(uuid, boolean), admin_drivers(), admin_set_driver_suspended(uuid, boolean),
  admin_orders(text, text), admin_order(uuid), admin_cancel_order(uuid), admin_customers() to authenticated;
