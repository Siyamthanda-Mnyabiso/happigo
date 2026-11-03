-- What customers can browse: restaurants that have finished onboarding and their available menu items.
-- "Listed" is derived (active plan + bank account + at least one branch), never set by hand.

alter table restaurants
  add column cuisine text,
  add column delivery_fee_cents integer not null default 1500 check (delivery_fee_cents >= 0),
  add column image_url text;

alter table menu_items
  add column category text not null default 'Mains',
  add column image_url text;

create function private.restaurant_is_listed(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.subscriptions s where s.restaurant_id = rid and s.status = 'active')
     and exists (select 1 from public.bank_accounts b where b.restaurant_id = rid)
     and exists (select 1 from public.branches br where br.restaurant_id = rid)
$$;

create function private.branch_is_listed(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.branches b where b.id = bid and private.restaurant_is_listed(b.restaurant_id)
  )
$$;

drop policy "restaurants read" on restaurants;
create policy "restaurants read" on restaurants for select using (
  owner_id = (select auth.uid()) or private.driver_sees_restaurant(id) or private.restaurant_is_listed(id)
);

drop policy "branches read" on branches;
create policy "branches read" on branches for select using (
  private.owns_restaurant(restaurant_id) or private.driver_sees_branch(id) or private.restaurant_is_listed(restaurant_id)
);

drop policy "menu read" on menu_items;
create policy "menu read" on menu_items for select using (
  private.owns_branch(branch_id) or (available and private.branch_is_listed(branch_id))
);

-- Signed-out visitors may browse, but only these columns (never owner_id, coordinates or bank details).
grant select (id, name, cuisine, delivery_fee_cents, image_url) on restaurants to anon;
grant select (id, restaurant_id, name, address, accepting_orders) on branches to anon;
