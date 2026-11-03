-- Order details a restaurant needs, items, and rules for how an order's status may change.

alter table orders
  add column customer_name text,
  add column delivery_address text,
  add column note text,
  add column prep_minutes smallint check (prep_minutes in (10, 15, 20, 30)),
  add column respond_by timestamptz,
  add column accepted_at timestamptz;

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  name text not null,
  options text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);
create index on order_items (order_id);
alter table order_items enable row level security;

create function private.can_see_order(oid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.id = oid
      and (o.customer_id = (select auth.uid()) or private.owns_branch(o.branch_id))
  )
$$;
create policy "order items read" on order_items for select using (private.can_see_order(order_id));
grant select on order_items to authenticated;

-- Every status change in the system.
create function private.order_transition_ok(a public.order_status, b public.order_status) returns boolean
language sql immutable set search_path = '' as $$
  select (a, b) in (
    ('new', 'preparing'), ('new', 'declined'), ('new', 'cancelled'),
    ('preparing', 'ready'), ('preparing', 'cancelled'),
    ('ready', 'picked_up'), ('ready', 'cancelled'),
    ('picked_up', 'delivered')
  )
$$;

-- What a restaurant may do itself. Pickup and delivery belong to the driver.
create function private.owner_transition_ok(a public.order_status, b public.order_status) returns boolean
language sql immutable set search_path = '' as $$
  select (a, b) in (('new', 'preparing'), ('new', 'declined'), ('preparing', 'ready'))
$$;

create function private.check_order_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not private.order_transition_ok(old.status, new.status) then
      raise exception 'Order cannot go from % to %', old.status, new.status using errcode = '23514';
    end if;
    if private.owns_branch(new.branch_id) and not private.owner_transition_ok(old.status, new.status) then
      raise exception 'A restaurant cannot move an order from % to %', old.status, new.status using errcode = '42501';
    end if;
    if new.status = 'preparing' then
      if new.prep_minutes is null then
        raise exception 'Choose a prep time' using errcode = '23514';
      end if;
      new.accepted_at := now();
    end if;
  end if;
  return new;
end $$;

create trigger orders_check_update before update on orders
  for each row execute function private.check_order_update();

grant update (prep_minutes) on orders to authenticated;
