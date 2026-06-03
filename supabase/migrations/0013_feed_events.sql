-- Generic activity-feed events that aren't weekly check-ins.
--
-- First use: a daily push-up recap. The push-up checker
-- (scripts/award_pushups.mjs) upserts one row per Brisbane day summarising who
-- hit that day's target and the +1 point each earned. It refreshes the row on
-- every run through the evening, so by midnight it's the final recap.
--
-- `payload` is denormalised on purpose — it's a point-in-time snapshot of that
-- day, so storing the participants' names/colors/avatars in it keeps the feed a
-- single cheap read with no joins, and the recap stays faithful even if a
-- profile changes later.
create table if not exists public.feed_events (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('push_up_daily_summary')),
  event_date  date not null,                       -- Brisbane day the event is about
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kind, event_date)                         -- one recap per day; script upserts
);

alter table public.feed_events enable row level security;

-- Anyone signed in can read the feed. Writes come from the push-up script via
-- the service-role key, which bypasses RLS — so no write policy is needed.
drop policy if exists "feed_events_read_authenticated" on public.feed_events;
create policy "feed_events_read_authenticated"
  on public.feed_events for select
  to authenticated using (true);

grant select on public.feed_events to authenticated;
