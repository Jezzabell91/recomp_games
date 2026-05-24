-- Separate public bucket for avatars. Body/scale photos stay private in `photos`.
-- Avatars become stable public URLs — no signed-URL refresh logic, no expiry footguns.

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;

drop policy if exists "avatars_read_public"           on storage.objects;
drop policy if exists "avatars_insert_owner_or_admin" on storage.objects;
drop policy if exists "avatars_update_owner_or_admin" on storage.objects;
drop policy if exists "avatars_delete_owner_or_admin" on storage.objects;

-- Read: anyone (incl. anon) — bucket is public, but we add an explicit policy so RLS is consistent.
create policy "avatars_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Write: owner can write `<uid>.jpg`; admin can write anything in the bucket.
-- The owner-write rule is intentionally permissive for a future Phase 2
-- "let participants change their own avatar" surface. In Phase 1 only the
-- seed script (service role, bypasses RLS) ever writes here.
create policy "avatars_insert_owner_or_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      name = auth.uid()::text || '.jpg'
      or public.is_admin()
    )
  );

create policy "avatars_update_owner_or_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  )
  with check (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  );

create policy "avatars_delete_owner_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  );
