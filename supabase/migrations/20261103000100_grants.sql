-- New Supabase projects give anon/authenticated no table privileges by default, so every table
-- needs explicit grants. Row level security (policies in the init migration) then decides which
-- rows. Grants here are the minimum each role needs. service_role bypasses both.

-- Signed-in users
grant select on profiles to authenticated;
grant update (full_name) on profiles to authenticated;          -- role can never be changed by the user

grant select, insert, update, delete on restaurants to authenticated;
grant select, insert, update, delete on branches to authenticated;
grant select, insert, update on subscriptions to authenticated;
grant select on subscription_payments to authenticated;          -- written by the billing system only
grant select, insert, update, delete on bank_accounts to authenticated;
grant select, insert, update, delete on menu_items to authenticated;
grant select on orders to authenticated;
grant update (status) on orders to authenticated;                -- never the amounts
grant select on payouts to authenticated;                        -- written by the payout system only

-- Signed-out visitors can only browse the menu (customers browse before signing in)
grant select on menu_items to anon;
