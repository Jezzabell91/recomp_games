-- Source data for the push-up challenge, moved from CSV into Postgres so the
-- Supabase Edge Function (which has no repo filesystem) can read it — and so
-- targets can be tweaked with a plain UPDATE instead of a code change.
--
-- Mirrors pushup_targets.csv and team_fitness_activity_ids.csv. If you stay on
-- the GitHub Action instead, these tables are simply unused.

-- One target per Brisbane calendar day. target = 0 means a rest day.
create table if not exists public.pushup_targets (
  event_date date primary key,
  target      integer not null check (target >= 0)
);

-- Maps each participant to their external Push-Up Challenge activity id.
create table if not exists public.pushup_activity (
  user_id     uuid primary key references public.users(id) on delete cascade,
  activity_id text not null
);

alter table public.pushup_targets  enable row level security;
alter table public.pushup_activity enable row level security;

-- Targets are harmless to read; the activity map is internal (service-role only,
-- which bypasses RLS — so no read policy granted to authenticated users).
drop policy if exists "pushup_targets_read" on public.pushup_targets;
create policy "pushup_targets_read"
  on public.pushup_targets for select to authenticated using (true);

grant select on public.pushup_targets to authenticated;

-- ── Seed targets (June 2026) ─────────────────────────────────────────────
insert into public.pushup_targets (event_date, target) values
  ('2026-06-03', 100), ('2026-06-04', 72),  ('2026-06-05', 120),
  ('2026-06-06', 150), ('2026-06-07', 0),   ('2026-06-08', 140),
  ('2026-06-09', 170), ('2026-06-10', 130), ('2026-06-11', 160),
  ('2026-06-12', 167), ('2026-06-13', 191), ('2026-06-14', 0),
  ('2026-06-15', 120), ('2026-06-16', 220), ('2026-06-17', 160),
  ('2026-06-18', 190), ('2026-06-19', 170), ('2026-06-20', 208),
  ('2026-06-21', 0),   ('2026-06-22', 120), ('2026-06-23', 180),
  ('2026-06-24', 229), ('2026-06-25', 160), ('2026-06-26', 150)
on conflict (event_date) do update set target = excluded.target;

-- ── Seed activity ids (joined to seeded users by display_name) ───────────
insert into public.pushup_activity (user_id, activity_id)
select u.id, v.activity_id
from (values
  ('Joe','1065049'), ('Jeremy','1014588'), ('Davis','1133472'),
  ('Jason','1125240'), ('Jimmy','1157255'), ('Aidan','1124261'),
  ('Justin','1141962'), ('Andrew','1154482'), ('Brenton','1155049'),
  ('Vishal','1161285')
) as v(name, activity_id)
join public.users u on u.display_name = v.name
on conflict (user_id) do update set activity_id = excluded.activity_id;
