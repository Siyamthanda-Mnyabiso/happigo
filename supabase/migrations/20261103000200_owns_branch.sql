-- Policies that looked up `branches` in a subquery ran with the caller's privileges, so signed-out
-- visitors browsing a menu hit "permission denied for table branches". A security definer helper
-- answers "does this user own this branch" without exposing the branches table.

create function owns_branch(bid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from branches b join restaurants r on r.id = b.restaurant_id
    where b.id = bid and r.owner_id = auth.uid()
  )
$$;

drop policy "owner menu" on menu_items;
create policy "owner menu" on menu_items for all
  using (owns_branch(branch_id)) with check (owns_branch(branch_id));

drop policy "owner orders read" on orders;
create policy "owner orders read" on orders for select using (owns_branch(branch_id));

drop policy "owner orders update" on orders;
create policy "owner orders update" on orders for update
  using (owns_branch(branch_id)) with check (owns_branch(branch_id));
