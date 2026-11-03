-- DEV ONLY. Run by hand in the Supabase SQL editor after onboarding a test partner.
-- Adds two new orders to the first restaurant's first branch so the Orders screen has something to show.
-- Never part of the migrations.

with b as (
  insert into branches (restaurant_id, name, address, accepting_orders)
  select r.id, 'Long St', '88 Long St, Cape Town', true
  from restaurants r
  where not exists (select 1 from branches where restaurant_id = r.id)
  order by r.created_at limit 1
  returning id
), branch as (
  select id from b union all select id from branches order by id limit 1
), o1 as (
  insert into orders (branch_id, food_cents, delivery_fee_cents, customer_name, delivery_address, note, respond_by)
  select id, 14300, 1500, 'Siya M.', '12 Main Rd, Gardens', 'No pickles on the burger please', now() + interval '3 minutes' from branch
  returning id
), o2 as (
  insert into orders (branch_id, food_cents, delivery_fee_cents, customer_name, delivery_address, respond_by)
  select id, 12400, 1500, 'Lerato K.', '4 Kloof St, Gardens', now() + interval '5 minutes' from branch
  returning id
)
insert into order_items (order_id, name, options, quantity, unit_price_cents)
select id, 'Classic Cheeseburger', 'Regular, extra cheese', 1, 7300 from o1
union all select id, 'Loaded Fries', null, 2, 3500 from o1
union all select id, 'Double Smash', null, 1, 8900 from o2
union all select id, 'Loaded Fries', null, 1, 3500 from o2;
