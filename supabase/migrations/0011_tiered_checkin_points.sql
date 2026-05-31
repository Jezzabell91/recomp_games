-- Tier the weekly_checkin auto-award by submit day (Brisbane):
--   Mon = 5, Tue = 4, Wed = 3, Thu = 2, Fri = 1, Sat/Sun = 0 (no row).
-- A 30-minute grace past each midnight credits the prior day, so a
-- 23:59:55 submit that commits at 00:00:02 doesn't silently drop a tier.
-- Replaces the Monday-only trigger from 0008. The partial unique on
-- (user_id, week_start) where category='weekly_checkin' from 0008 still
-- holds — admin_set_weekly_points overrides remain the escape hatch.

create or replace function public.award_weekly_checkin_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted_brisbane timestamp;
  week_start_ts      timestamp;
  award              integer;
begin
  submitted_brisbane := NEW.submitted_at at time zone 'Australia/Brisbane';
  week_start_ts      := NEW.week_start::timestamp;

  if    submitted_brisbane < week_start_ts + interval '1 day' + interval '30 minutes' then
    award := 5;
  elsif submitted_brisbane < week_start_ts + interval '2 days' + interval '30 minutes' then
    award := 4;
  elsif submitted_brisbane < week_start_ts + interval '3 days' + interval '30 minutes' then
    award := 3;
  elsif submitted_brisbane < week_start_ts + interval '4 days' + interval '30 minutes' then
    award := 2;
  elsif submitted_brisbane < week_start_ts + interval '5 days' + interval '30 minutes' then
    award := 1;
  else
    award := 0;
  end if;

  if award > 0 then
    insert into public.points (user_id, week_start, value, category, reason, awarded_by)
    values (NEW.user_id, NEW.week_start, award, 'weekly_checkin',
            'Auto-awarded for weekly check-in', null)
    on conflict (user_id, week_start) where category = 'weekly_checkin' do nothing;
  end if;

  return NEW;
end;
$$;
