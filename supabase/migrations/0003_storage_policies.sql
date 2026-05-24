-- Storage RLS policies for the `photos` bucket.
-- Path convention: <user_id>/<category>/<...>
--   <user_id> is the auth user's UUID
--   <category> is one of: initial, final, checkin
-- Read: any authenticated participant can read any photo (group sharing).
-- Write: only the owner (or an admin) can put/update/delete in their own folder.

-- Drop old versions if re-running.
drop policy if exists "photos_read_authenticated"   on storage.objects;
drop policy if exists "photos_insert_owner_or_admin" on storage.objects;
drop policy if exists "photos_update_owner_or_admin" on storage.objects;
drop policy if exists "photos_delete_owner_or_admin" on storage.objects;

-- Read: anyone signed in can view photos in the bucket.
create policy "photos_read_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos');

-- Insert: path must start with the caller's UID; admins can insert anywhere
-- (useful for seeding initial photos on a user's behalf).
create policy "photos_insert_owner_or_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Update: same rule as insert.
create policy "photos_update_owner_or_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Delete: same rule.
create policy "photos_delete_owner_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
