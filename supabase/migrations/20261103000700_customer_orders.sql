-- Customers: placing orders safely and following them.
-- The browser never sends prices. place_order prices every item from the menu and takes the delivery
-- fee from the restaurant, so a customer can't pay less by editing a request.

alter table orders
  add column payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed'));

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  label text not null,
  address text not null,
  created_at timestamptz not null default now()
);
create index on customer_addresses (user_id);
alter table customer_addresses enable row level security;
create policy "own addresses" on customer_addresses for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on customer_addresses to authenticated;

create function place_order(
  p_branch uuid, p_items jsonb, p_address text, p_instructions text, p_note text,
  p_payment text, p_tip integer, p_lat double precision default null, p_lng double precision default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  rid uuid;
  fee integer;
  food integer;
  wanted integer;
  matched integer;
  oid uuid;
  cname text;
begin
  if uid is null or not exists (select 1 from public.profiles where id = uid and role = 'customer') then
    raise exception 'Sign in to order' using errcode = '42501';
  end if;

  select b.restaurant_id into rid from public.branches b
   where b.id = p_branch and b.accepting_orders and private.restaurant_is_listed(b.restaurant_id);
  if rid is null then
    raise exception 'This restaurant is not taking orders right now' using errcode = '23514';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'Your cart is empty' using errcode = '23514';
  end if;
  if p_payment not in ('card', 'cash') then
    raise exception 'Choose how you will pay' using errcode = '23514';
  end if;
  if p_tip is null or p_tip not between 0 and 50000 then
    raise exception 'Tip must be between R0 and R500' using errcode = '23514';
  end if;
  if length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'Enter a delivery address' using errcode = '23514';
  end if;

  create temporary table pg_temp.req on commit drop as
    select (e ->> 'id')::uuid as id, sum((e ->> 'qty')::integer)::integer as qty
      from jsonb_array_elements(p_items) e group by 1;
  if exists (select 1 from pg_temp.req where qty < 1 or qty > 20) then
    raise exception 'Choose between 1 and 20 of each item' using errcode = '23514';
  end if;

  select count(*) into wanted from pg_temp.req;
  select count(*), coalesce(sum(m.price_cents * r.qty), 0) into matched, food
    from pg_temp.req r join public.menu_items m on m.id = r.id and m.branch_id = p_branch and m.available;
  if matched <> wanted then
    raise exception 'Some items are no longer available' using errcode = '23514';
  end if;

  select delivery_fee_cents into fee from public.restaurants where id = rid;
  select coalesce(full_name, 'Customer') into cname from public.profiles where id = uid;

  insert into public.orders (
    branch_id, customer_id, customer_name, delivery_address, delivery_instructions, note,
    payment_method, food_cents, delivery_fee_cents, tip_cents, delivery_lat, delivery_lng,
    respond_by,
    -- STUB: card orders are marked paid immediately. Replace with the payment provider's confirmation
    -- (Paystack or Peach, TBC) so a card order only reaches the restaurant once it is really paid.
    payment_status
  ) values (
    p_branch, uid, cname, trim(p_address), nullif(trim(coalesce(p_instructions, '')), ''),
    nullif(trim(coalesce(p_note, '')), ''), p_payment, food, fee, p_tip, p_lat, p_lng,
    now() + interval '3 minutes',
    case when p_payment = 'card' then 'paid' else 'pending' end
  ) returning id into oid;

  insert into public.order_items (order_id, name, quantity, unit_price_cents)
    select oid, m.name, r.qty, m.price_cents
      from pg_temp.req r join public.menu_items m on m.id = r.id;

  return oid;
end $$;

-- Customers follow their order, including who is bringing it (first name and vehicle only).
create function order_tracking(oid uuid)
returns table (status public.order_status, driver_first_name text, vehicle_model text, vehicle_plate text)
language sql stable security definer set search_path = '' as $$
  select o.status,
         split_part(p.full_name, ' ', 1),
         d.vehicle_model,
         d.vehicle_plate
    from public.orders o
    left join public.profiles p on p.id = o.driver_id
    left join public.driver_profiles d on d.user_id = o.driver_id
   where o.id = oid and o.customer_id = (select auth.uid())
$$;

revoke execute on function place_order(uuid, jsonb, text, text, text, text, integer, double precision, double precision),
  order_tracking(uuid) from public, anon;
grant execute on function place_order(uuid, jsonb, text, text, text, text, integer, double precision, double precision),
  order_tracking(uuid) to authenticated;
