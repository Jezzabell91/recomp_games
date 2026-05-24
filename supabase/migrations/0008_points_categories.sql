-- Reshape `points` to accept all scoring categories from the landing-page rubric.
-- Phase 1 only writes `weekly_checkin` rows (via the trigger below); other
-- categories are inserted by future admin sub-pages without further schema
-- changes.

alter table public.points
  add column if not exists category text not null default 'weekly_checkin'
    check (category in (
      'weekly_checkin',     -- 5 pts auto-awarded for valid Monday check-in (26 × 5 = 130 max)
      'monthly_challenge',  -- fitness challenges, 25 × 4 = 100 max
      'bonus_star',         -- revealed at finale, 20 × 5 = 100 max
      'body_comp',          -- final-scan deltas, ~80 max
      'push_up_daily',      -- daily push-up bonuses during June
      'push_up_final',      -- push-up challenge result
      'points_steal',       -- 3 tokens × 10 pts each
      'midpoint_photos',    -- September progress photos
      'manual_adjustment'   -- escape hatch
    ));

-- week_start is only meaningful for weekly_checkin (and possibly push_up_daily later).
-- For finale categories like bonus_star or body_comp, it's null.
alter table public.points alter column week_start drop not null;

-- Drop the old "one row per user per week" constraint — multiple categories
-- can pay out in the same week.
alter table public.points drop constraint if exists points_user_id_week_start_key;

-- Replace with a partial unique: at most one weekly_checkin row per (user, week).
-- Lets the trigger use ON CONFLICT to stay idempotent.
create unique index if not exists points_weekly_checkin_unique
  on public.points (user_id, week_start)
  where category = 'weekly_checkin';

-- Trigger function: award 5 points on every successful check_ins insert if
-- the submission landed before 00:30 Brisbane on the day after week_start.
-- Late check-ins create the check_ins row but no points row.
-- `at time zone 'Australia/Brisbane'` converts the timestamptz to a Brisbane
-- wall-clock timestamp; we then compare against the cutoff Brisbane wall-clock.
-- Relies on the function owner (postgres in Supabase) having BYPASSRLS so the
-- insert into public.points (which has admin-only RLS) succeeds. `security
-- definer` only sets the role; the BYPASSRLS attribute does the actual work.
create or replace function public.award_weekly_checkin_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted_brisbane timestamp;
  cutoff_brisbane    timestamp;
begin
  submitted_brisbane := NEW.submitted_at at time zone 'Australia/Brisbane';
  -- 00:30 Brisbane on the day AFTER week_start. The 30-minute grace past
  -- midnight is internal — users are told "closes 11:59 PM Monday" — and
  -- exists purely so a 23:59:55 Mon submit that commits at 00:00:02 Tue
  -- (network + DB write latency) doesn't silently lose its 5 points.
  cutoff_brisbane := (NEW.week_start + 1)::timestamp + interval '30 minutes';
  if submitted_brisbane < cutoff_brisbane then
    insert into public.points (user_id, week_start, value, category, reason, awarded_by)
    values (NEW.user_id, NEW.week_start, 5, 'weekly_checkin',
            'Auto-awarded for Monday check-in', null)
    on conflict (user_id, week_start) where category = 'weekly_checkin' do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_weekly_checkin on public.check_ins;
create trigger trg_award_weekly_checkin
  after insert on public.check_ins
  for each row execute function public.award_weekly_checkin_points();
