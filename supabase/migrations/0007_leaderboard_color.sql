-- Recreate the leaderboard view to include each user's color (needed for
-- per-row progress bars on the leaderboard and avatar gradients).
--
-- Important: `create or replace view` requires that the new column list begins
-- with EXACTLY the same columns (names, order, types) as the existing view,
-- and only appends new columns at the end. We can't insert `color` between
-- `avatar_url` and `total_points` even though it would group naturally — that
-- counts as "renaming column 4 from total_points to color" and Postgres rejects
-- it with 42P16. So `color` lives at the end of the SELECT list. Downstream
-- code references columns by name, so ordering doesn't matter to the app.

create or replace view public.leaderboard as
select
  u.id                              as user_id,
  u.display_name,
  u.avatar_url,
  coalesce(sum(p.value), 0)::int    as total_points,
  count(distinct c.week_start)::int as weeks_checked_in,
  u.color
from public.users u
left join public.points    p on p.user_id = u.id
left join public.check_ins c on c.user_id = u.id
group by u.id, u.display_name, u.avatar_url, u.color
order by total_points desc, weeks_checked_in desc;

grant select on public.leaderboard to anon, authenticated;
