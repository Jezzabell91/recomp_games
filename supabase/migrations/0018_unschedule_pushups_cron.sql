-- Turn off the push-up points checker — the challenge has finished.
--
-- The Edge Function (supabase/functions/award-pushup-points/index.ts) has no
-- timer of its own; it only runs because two pg_cron jobs invoke it (migrations
-- 0015 and 0016). Unscheduling both jobs stops it for good. The deployed
-- function can stay — it just never gets called now — or be deleted from the
-- Supabase dashboard (Edge Functions → award-pushup-points → Delete).
--
-- Idempotent: cron.unschedule(jobname) raises if the job is missing, so we drive
-- it off cron.job and only unschedule the rows that actually exist.

select cron.unschedule(jobid)
from cron.job
where jobname in ('award-pushups', 'award-pushups-final');

-- The helper is now dead code (nothing else calls it). Drop it and, optionally,
-- the Vault-stored invoke key.
drop function if exists public.invoke_award_pushups();
--   select vault.delete_secret('pushup_invoke_key');   -- optional cleanup

-- To re-enable later, re-run migrations 0015 + 0016 (they re-create the helper
-- and re-schedule both jobs).
