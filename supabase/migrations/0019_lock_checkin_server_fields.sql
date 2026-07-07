-- Lock down the two check_ins columns that decide how many points a check-in
-- earns, so a participant cannot forge them from the client.
--
-- Threat (pre-0019): the check_ins INSERT policy only checks
-- `user_id = auth.uid()`, and `submitted_at` / `week_start` are ordinary
-- client-writable columns. The auto-award trigger (0011) tiers points purely
-- from `NEW.submitted_at` vs `NEW.week_start`, so:
--   * A Friday submit (worth 1 pt) could send `submitted_at` = that week's
--     Monday and pocket the full 5.
--   * Because `week_start` was arbitrary (only bounded by the unique
--     (user_id, week_start) index), a user could bulk-insert one back-dated
--     row per challenge week they never actually checked in for and
--     self-award ~130 weekly_checkin points with no admin involvement.
--
-- Fix: a BEFORE trigger makes both columns server-owned. On INSERT we stamp
-- `submitted_at := now()` (ignoring whatever the client sent) and derive
-- `week_start` from the current Brisbane week — the same "Monday on or before
-- today in Brisbane" the client computes in lib/dates.js currentWeekStart(),
-- but computed from the actual commit instant so it can't be back-dated. On
-- UPDATE we pin both to their existing values so the columns can't be forged
-- after the fact either (the app never legitimately updates them).
--
-- This runs BEFORE the AFTER-INSERT award trigger from 0008/0011, so the award
-- logic sees the server-stamped values. No SECURITY DEFINER needed — the
-- function only mutates NEW and calls built-ins; search_path is pinned for
-- hygiene, consistent with the other functions in this schema.

create or replace function public.enforce_checkin_server_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    NEW.submitted_at := now();
    -- date_trunc('week', ...) returns Monday 00:00 of the ISO week (weeks start
    -- Monday), matching currentWeekStart(). `now() at time zone 'Australia/Brisbane'`
    -- yields the Brisbane wall-clock timestamp; we truncate that to the week.
    NEW.week_start   := date_trunc('week', (now() at time zone 'Australia/Brisbane'))::date;
  elsif TG_OP = 'UPDATE' then
    NEW.submitted_at := OLD.submitted_at;
    NEW.week_start   := OLD.week_start;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_checkin_enforce_server_fields on public.check_ins;
create trigger trg_checkin_enforce_server_fields
  before insert or update on public.check_ins
  for each row execute function public.enforce_checkin_server_fields();
