-- Admin RPCs for weekly_checkin point overrides.
--
-- PostgREST's `on_conflict` query parameter only takes column names; it cannot
-- pass through a WHERE predicate. So `.upsert({ onConflict: 'user_id,week_start' })`
-- generates `ON CONFLICT (user_id, week_start)` with no WHERE — and Postgres
-- index inference can't match our partial unique on `category = 'weekly_checkin'`,
-- so the call fails with "no unique or exclusion constraint matching the
-- ON CONFLICT specification." Wrap the raw upsert in a SECURITY DEFINER RPC
-- the admin calls via supabase.rpc('admin_set_weekly_points', { ... }).

create or replace function public.admin_set_weekly_points(
  p_user_id    uuid,
  p_week_start date,
  p_value      integer,
  p_reason     text default 'Admin override'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Belt-and-braces: RLS on points already rejects non-admin writes, but
  -- checking here gives a clearer error and avoids running the upsert.
  if not public.is_admin() then
    raise exception 'admin_set_weekly_points: not admin';
  end if;

  insert into public.points (user_id, week_start, value, category, reason, awarded_by)
  values (p_user_id, p_week_start, p_value, 'weekly_checkin', p_reason, auth.uid())
  on conflict (user_id, week_start) where category = 'weekly_checkin'
  do update set
    value      = excluded.value,
    reason     = excluded.reason,
    awarded_by = excluded.awarded_by,
    awarded_at = now();
end;
$$;

-- Companion for the "✕" delete button on the admin row: removes the
-- weekly_checkin row entirely (different from setting value to 0, which
-- records an explicit zero).
create or replace function public.admin_clear_weekly_points(
  p_user_id    uuid,
  p_week_start date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_clear_weekly_points: not admin';
  end if;
  delete from public.points
   where user_id    = p_user_id
     and week_start = p_week_start
     and category   = 'weekly_checkin';
end;
$$;

grant execute on function public.admin_set_weekly_points(uuid, date, integer, text) to authenticated;
grant execute on function public.admin_clear_weekly_points(uuid, date)               to authenticated;
