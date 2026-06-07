-- Fix a points double-counting bug in the leaderboard view.
--
-- The previous view joined BOTH points and check_ins directly to users and then
-- did sum(p.value):
--
--   from users u
--   left join points    p on p.user_id = u.id
--   left join check_ins c on c.user_id = u.id
--   group by u.id ...
--   sum(p.value)
--
-- That's a cartesian fan-out: each user's point rows are multiplied by their
-- number of check-in rows before summing. A user with 1 check-in is unaffected
-- (×1), but as soon as they have a 2nd weekly check-in every point is counted
-- twice (×2), a 3rd makes it ×3, and so on — so totals balloon as the challenge
-- runs. (count(distinct c.week_start) for weeks_checked_in was already immune,
-- which is why only total_points was wrong.)
--
-- Fix: pre-aggregate points and check_ins independently in subqueries, then join
-- the one-row-per-user results. No fan-out, so each point is summed exactly once.
--
-- Column list/order is preserved (user_id, display_name, avatar_url,
-- total_points, weeks_checked_in, color) so `create or replace view` is accepted
-- (Postgres 42P16 otherwise) and downstream code is unchanged.

create or replace view public.leaderboard as
select
  u.id                                  as user_id,
  u.display_name,
  u.avatar_url,
  coalesce(pa.total_points, 0)::int     as total_points,
  coalesce(ca.weeks_checked_in, 0)::int as weeks_checked_in,
  u.color
from public.users u
left join (
  select user_id, sum(value) as total_points
  from public.points
  group by user_id
) pa on pa.user_id = u.id
left join (
  select user_id, count(distinct week_start) as weeks_checked_in
  from public.check_ins
  group by user_id
) ca on ca.user_id = u.id
order by total_points desc, weeks_checked_in desc;

grant select on public.leaderboard to anon, authenticated;
