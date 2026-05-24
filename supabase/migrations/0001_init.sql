-- Recomp Games schema (Phase 1)
-- Run in Supabase SQL editor. Idempotent where reasonable.

-- =========================================================
-- Extensions
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- Tables
-- =========================================================

-- Profile row per participant. id matches auth.users.id (Supabase Auth).
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Initial body photos (front/side/back). taken once at start, can be backfilled.
create table if not exists public.initial_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  pose        text not null check (pose in ('front','side','back')),
  storage_path text not null,
  taken_at    timestamptz not null default now(),
  unique (user_id, pose)
);

-- Final body photos at end of challenge.
create table if not exists public.final_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  pose        text not null check (pose in ('front','side','back')),
  storage_path text not null,
  taken_at    timestamptz not null default now(),
  unique (user_id, pose)
);

-- Weekly check-in: scale photo + weight + sentence.
-- week_start is the Monday (Brisbane) that the week begins on.
create table if not exists public.check_ins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  week_start          date not null,
  scale_photo_path    text not null,
  weight_kg           numeric(5,2) not null,
  note                text not null,
  submitted_at        timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Admin-awarded points per user per week.
create table if not exists public.points (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  week_start      date not null,
  value           integer not null,
  reason          text,
  awarded_by      uuid references public.users(id),
  awarded_at      timestamptz not null default now(),
  unique (user_id, week_start)
);

-- =========================================================
-- Public leaderboard view (no photos, no notes — safe to expose)
-- =========================================================
create or replace view public.leaderboard as
select
  u.id              as user_id,
  u.display_name,
  u.avatar_url,
  coalesce(sum(p.value), 0)::int  as total_points,
  count(distinct c.week_start)::int as weeks_checked_in
from public.users u
left join public.points p on p.user_id = u.id
left join public.check_ins c on c.user_id = u.id
group by u.id, u.display_name, u.avatar_url
order by total_points desc, weeks_checked_in desc;

-- =========================================================
-- Helper: am I admin?
-- =========================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.users where id = auth.uid()), false);
$$;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.users          enable row level security;
alter table public.initial_photos enable row level security;
alter table public.final_photos   enable row level security;
alter table public.check_ins      enable row level security;
alter table public.points         enable row level security;

-- users: anyone authenticated can read (needed to render names alongside check-ins)
drop policy if exists "users_read_authenticated" on public.users;
create policy "users_read_authenticated"
  on public.users for select
  to authenticated
  using (true);

-- users: only self can update own profile; only admin can update is_admin (enforced via column priv elsewhere if needed)
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- initial_photos: owner + all authenticated (group sharing) can read; only owner can write
drop policy if exists "initial_photos_read_group" on public.initial_photos;
create policy "initial_photos_read_group"
  on public.initial_photos for select
  to authenticated
  using (true);

drop policy if exists "initial_photos_write_owner" on public.initial_photos;
create policy "initial_photos_write_owner"
  on public.initial_photos for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- final_photos: same model
drop policy if exists "final_photos_read_group" on public.final_photos;
create policy "final_photos_read_group"
  on public.final_photos for select
  to authenticated
  using (true);

drop policy if exists "final_photos_write_owner" on public.final_photos;
create policy "final_photos_write_owner"
  on public.final_photos for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- check_ins: owner + admin read+write; group members can read (for shared photos)
drop policy if exists "check_ins_read_group" on public.check_ins;
create policy "check_ins_read_group"
  on public.check_ins for select
  to authenticated
  using (true);

drop policy if exists "check_ins_write_owner" on public.check_ins;
create policy "check_ins_write_owner"
  on public.check_ins for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- points: anyone authenticated can read; only admin can write
drop policy if exists "points_read_authenticated" on public.points;
create policy "points_read_authenticated"
  on public.points for select
  to authenticated
  using (true);

drop policy if exists "points_write_admin" on public.points;
create policy "points_write_admin"
  on public.points for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public leaderboard view is exposed to anon via the Data API.
-- The view itself runs as the invoker; since underlying tables have RLS,
-- we grant SELECT to anon on the view explicitly.
grant select on public.leaderboard to anon, authenticated;

-- =========================================================
-- Storage buckets
-- =========================================================
-- Create the private photos bucket via the dashboard, OR uncomment below.
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
--   on conflict (id) do nothing;

-- Storage policies (apply via dashboard UI on the 'photos' bucket):
--   * authenticated users can SELECT (read) any object in 'photos'
--   * authenticated users can INSERT objects under a path that starts with their auth.uid()
--   * authenticated users can UPDATE/DELETE their own objects
-- These are set in the next migration once the bucket exists.
