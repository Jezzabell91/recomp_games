-- Fix Critical #1: stop a participant from escalating themselves to admin.
--
-- Threat (pre-0020): the users_update_self policy (0001) gates only the ROW
--   using  (id = auth.uid())
--   with check (id = auth.uid())
-- but places no restriction on WHICH COLUMNS change, and 0002_grants granted
-- `authenticated` table-wide UPDATE on public.users. So any signed-in user could
-- run, straight from the browser console:
--   update public.users set is_admin = true where id = '<their own id>';
-- That passes RLS (it's their own row), flips public.is_admin() to true for
-- them, and unlocks points_write_admin (0001) — which is scoped only by
-- is_admin(), not by user_id — letting them insert/update/delete ANY
-- participant's points, check_ins, and photos. This is the one hole the
-- documented "loose but bounded" trust model does NOT accept.
--
-- Fix: privileges, not data. Move UPDATE from the whole table down to only the
-- three columns a user may legitimately edit about themselves. Column-level
-- privileges are enforced BELOW RLS, so even a future mis-scoped UPDATE policy
-- cannot reopen is_admin. This changes no rows — existing admins (just Jeremy)
-- keep their flag. The app performs no client-side writes to users today (all
-- user mutations run through the service-role seed script, which is unaffected
-- because service_role has its own grants), so nothing breaks, and a future
-- profile-edit UI on these columns needs no further migration.
--
-- Note: is_admin can still be changed by service_role (Supabase dashboard / the
-- seed script). To promote someone later, do it there — never from the client.

revoke update on public.users from authenticated;
grant update (display_name, avatar_url, color) on public.users to authenticated;

-- INSERT/DELETE on users need no change: users has only select + update
-- policies, so RLS already default-denies client insert/delete regardless of
-- the table grants from 0002.

-- After applying, re-confirm the admin set is exactly who you expect:
--   select id, display_name, is_admin from public.users where is_admin = true;
-- Only Jeremy (434cfe51-3bd3-42f0-876c-a94091cf205f) should appear.
