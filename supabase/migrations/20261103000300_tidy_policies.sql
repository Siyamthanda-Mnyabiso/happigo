-- Advisor fixes: helper functions move to a private schema (not exposed through the API), auth.uid()
-- is wrapped in (select ...) so it is evaluated once per query, and overlapping SELECT policies are merged.

create schema private;
grant usage on schema private to anon, authenticated;

create function private.owns_restaurant(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.restaurants where id = rid and owner_id = (select auth.uid()))
$$;

create function private.owns_branch(bid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.branches b join public.restaurants r on r.id = b.restaurant_id
    where b.id = bid and r.owner_id = (select auth.uid())
  )
$$;

-- profiles
drop policy "own profile" on profiles;
drop policy "own profile update" on profiles;
create policy "own profile" on profiles for select using (id = (select auth.uid()));
create policy "own profile update" on profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from profiles p where p.id = (select auth.uid())));

-- restaurants and everything that hangs off one
drop policy "owner restaurants" on restaurants;
create policy "owner restaurants" on restaurants for all
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy "owner branches" on branches;
create policy "owner branches" on branches for all
  using (private.owns_restaurant(restaurant_id)) with check (private.owns_restaurant(restaurant_id));

drop policy "owner subscription read" on subscriptions;
drop policy "owner subscription write" on subscriptions;
drop policy "owner subscription change" on subscriptions;
create policy "owner subscription read" on subscriptions for select using (private.owns_restaurant(restaurant_id));
create policy "owner subscription write" on subscriptions for insert with check (private.owns_restaurant(restaurant_id));
create policy "owner subscription change" on subscriptions for update
  using (private.owns_restaurant(restaurant_id)) with check (private.owns_restaurant(restaurant_id));

drop policy "owner payments read" on subscription_payments;
create policy "owner payments read" on subscription_payments for select using (private.owns_restaurant(restaurant_id));

drop policy "owner bank" on bank_accounts;
create policy "owner bank" on bank_accounts for all
  using (private.owns_restaurant(restaurant_id)) with check (private.owns_restaurant(restaurant_id));

drop policy "owner payouts read" on payouts;
create policy "owner payouts read" on payouts for select using (private.owns_restaurant(restaurant_id));

-- menu: one SELECT policy (public sees available items, owners see everything), writes for owners only
drop policy "owner menu" on menu_items;
drop policy "public menu read" on menu_items;
create policy "menu read" on menu_items for select using (available or private.owns_branch(branch_id));
create policy "menu insert" on menu_items for insert with check (private.owns_branch(branch_id));
create policy "menu update" on menu_items for update
  using (private.owns_branch(branch_id)) with check (private.owns_branch(branch_id));
create policy "menu delete" on menu_items for delete using (private.owns_branch(branch_id));

-- orders: one SELECT policy (customer's own or the owning restaurant's)
drop policy "owner orders read" on orders;
drop policy "customer own orders" on orders;
drop policy "owner orders update" on orders;
create policy "orders read" on orders for select
  using (customer_id = (select auth.uid()) or private.owns_branch(branch_id));
create policy "owner orders update" on orders for update
  using (private.owns_branch(branch_id)) with check (private.owns_branch(branch_id));

drop function public.owns_restaurant(uuid);
drop function public.owns_branch(uuid);

-- The signup trigger is never meant to be called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
