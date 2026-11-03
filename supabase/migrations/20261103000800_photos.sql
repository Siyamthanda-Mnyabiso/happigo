-- Food photos. One public bucket (customers see photos without signing in). A restaurant may only
-- write inside its own folder, "<restaurant id>/<file>", checked against restaurants.owner_id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('food-photos', 'food-photos', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- The first path segment must be a uuid before we cast it, and SQL does not promise to skip the
-- cast when a condition fails, so the guard and the cast live in one CASE.
create function private.owns_photo_path(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
      then private.owns_restaurant(split_part(object_name, '/', 1)::uuid)
    else false
  end
$$;
revoke execute on function private.owns_photo_path(text) from public, anon;
grant execute on function private.owns_photo_path(text) to authenticated;

-- Public reads need no policy (the bucket is public). Owners still need select to replace or remove
-- their own files, because a delete can only touch rows the user is allowed to see.
create policy "owners see their photos" on storage.objects for select to authenticated
  using (bucket_id = 'food-photos' and private.owns_photo_path(name));
create policy "owners add photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'food-photos' and private.owns_photo_path(name));
create policy "owners replace photos" on storage.objects for update to authenticated
  using (bucket_id = 'food-photos' and private.owns_photo_path(name))
  with check (bucket_id = 'food-photos' and private.owns_photo_path(name));
create policy "owners delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'food-photos' and private.owns_photo_path(name));

-- A saved photo address must be one of ours. The customer pages load these through next/image,
-- which refuses other hosts, so a stray URL would otherwise break the page for everyone.
alter table restaurants add constraint restaurants_image_url_ours check (
  image_url is null or image_url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/food-photos/[0-9a-f-]{36}/[^/]+$');
alter table menu_items add constraint menu_items_image_url_ours check (
  image_url is null or image_url ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/food-photos/[0-9a-f-]{36}/[^/]+$');
