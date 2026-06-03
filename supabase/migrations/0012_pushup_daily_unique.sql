-- Daily push-up bonus idempotency.
--
-- The push-up checker (scripts/award_pushups.mjs) polls each participant's live
-- count every 30 min through the afternoon and awards 1 point the first time
-- they cross that day's target. Because it runs many times per day, the insert
-- MUST be idempotent: at most one push_up_daily row per (user, calendar day).
--
-- We reuse `week_start` to hold the date the bonus was earned for. 0008 already
-- anticipated this ("week_start ... possibly push_up_daily later") and made the
-- column nullable, and the old global unique (user_id, week_start) was dropped
-- there, so a partial unique scoped to this category is safe and sufficient.
create unique index if not exists points_push_up_daily_unique
  on public.points (user_id, week_start)
  where category = 'push_up_daily';
