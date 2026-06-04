-- Schedule the award-pushups Edge Function with pg_cron — the reliable,
-- on-time alternative to GitHub's best-effort scheduler.
--
-- The function URL below is set to this project's ref (mtmnmpharmzwzxokvhwa) and
-- the deployed function slug (award-pushup-points). If you ever rename the
-- function, update the slug to match. Run this AFTER storing the invoke key in
-- Vault (see the create_secret line).
--
-- pg_cron schedules are interpreted in UTC, same as the GitHub workflow, so the
-- cron strings are identical. Brisbane is UTC+10 (no DST):
--   12:07pm Brisbane = 02:07 UTC   •   11:58pm Brisbane = 13:58 UTC
--
-- IMPORTANT: run EITHER this OR the GitHub Action, not both. (Both is harmless
-- — idempotency dedupes — but it's wasteful and confusing.) To stop the GitHub
-- one, delete/disable .github/workflows/award-pushups.yml.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- Store the invoke key in Vault so it isn't committed in plaintext here. Use the
-- service-role key (the classic `eyJ...` JWT from .env.local) — this project's
-- anon key is the newer `sb_publishable_...` format, which doesn't reliably pass
-- the function gateway's JWT check. Vault keeps it encrypted at rest. The bearer
-- only authorizes the call; the function still uses its own auto-injected
-- service-role key to write. Run once (replace the value):
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'pushup_invoke_key');

-- Helper: post to the Edge Function using the Vault-stored key.
create or replace function public.invoke_award_pushups()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoke_key text;
begin
  select decrypted_secret into invoke_key
    from vault.decrypted_secrets where name = 'pushup_invoke_key';

  perform net.http_post(
    url     := 'https://mtmnmpharmzwzxokvhwa.supabase.co/functions/v1/award-pushup-points',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || invoke_key,
      'apikey', invoke_key
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- Every 30 min, 12:07pm–11:37pm Brisbane (02:07–13:37 UTC), at off-peak minutes.
select cron.schedule(
  'award-pushups',
  '7,37 2-13 * * *',
  $$ select public.invoke_award_pushups(); $$
);

-- Final sweep at 11:58pm Brisbane (13:58 UTC), just before the API resets.
select cron.schedule(
  'award-pushups-final',
  '58 13 * * *',
  $$ select public.invoke_award_pushups(); $$
);

-- To remove later:
--   select cron.unschedule('award-pushups');
--   select cron.unschedule('award-pushups-final');
