-- DEV ONLY. Run by hand in the Supabase SQL editor after you have a restaurant (see dev-seed.sql).
-- Gives the first branch map coordinates and adds an order that restaurants have already accepted
-- (status preparing) with a tip, so a driver who is online sees a delivery to accept.
-- Never part of the migrations.

update branches set lat = -33.9249, lng = 18.4241
 where id = (select id from branches order by created_at limit 1);

with o as (
  insert into orders (branch_id, status, prep_minutes, accepted_at, food_cents, delivery_fee_cents, tip_cents,
      customer_name, delivery_address, delivery_instructions, note, payment_method, delivery_lat, delivery_lng)
  select id, 'preparing', 15, now(), 14300, 1500, 1000,
      'Siya M.', '12 Main Rd, Gardens', 'Gate code 1234', 'No pickles on the burger please', 'card', -33.9349, 18.4141
    from branches order by created_at limit 1
  returning id
)
insert into order_items (order_id, name, options, quantity, unit_price_cents)
select id, 'Classic Cheeseburger', 'Regular, extra cheese', 1, 7300 from o
union all select id, 'Loaded Fries', null, 2, 3500 from o;
