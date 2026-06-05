-- Move the final push-up sweep to 2:00am the NEXT day (Brisbane), replacing the
-- old 11:58pm sweep. Why: people who finish their push-ups in the last minutes
-- before midnight (e.g. 11:59pm) land AFTER the 11:58pm run and miss their point
-- until the next afternoon. A 2am run catches them the same night.
--
-- This is safe because the upstream API keeps a short per-day HISTORY: requesting
-- a past date returns that day's FINAL count (verified: a query for an earlier
-- date returns that day plus the two prior days with their final totals). So at
-- 2am the function can look back at "yesterday" and award the points it missed.
--
-- pg_cron runs in UTC. Brisbane is UTC+10 (no DST):
--   2:00am Brisbane = 16:00 UTC (the previous calendar day).
--
-- PREREQUISITE: the 2am sweep only backfills the prior day if the DEPLOYED Edge
-- Function processes a today+yesterday window (see supabase/functions/
-- award-pushup-points/index.ts). The single-day version would only ever look at
-- the new day at 2am and award nothing for the day that just ended. Deploy that
-- function before relying on this schedule.
--
-- cron.schedule() upserts by job name, so re-running this re-points the existing
-- 'award-pushups-final' job at the new time.

select cron.schedule(
  'award-pushups-final',
  '0 16 * * *',                       -- 2:00am Brisbane (16:00 UTC prev day)
  $$ select public.invoke_award_pushups(); $$
);

-- To revert to the old 11:58pm Brisbane sweep:
--   select cron.schedule('award-pushups-final', '58 13 * * *',
--     $$ select public.invoke_award_pushups(); $$);
