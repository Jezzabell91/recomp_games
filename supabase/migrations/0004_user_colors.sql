-- Add per-user color column for avatars, sparklines, progress bars.
--
-- Just add the column with a default. Per-user colors are owned by
-- scripts/seed_users.mjs (single source of truth — adding the other six
-- participants later doesn't require another migration). Re-running seed
-- rewrites this column for every user in the USERS array.

alter table public.users
  add column if not exists color text not null default '#FFD700';
