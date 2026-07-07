-- Manual point adjustments: the 'manual_adjustment' category from 0008 gets
-- its RPCs and an Admin tab. Adjustments are signed (positive or negative),
-- carry no week_start, and flow into leaderboard.total_points automatically
-- via the 0017 view — no view change needed.
--
-- They are also SILENT: the read policy below hides manual_adjustment rows
-- from non-admins, so participants can't discover them even by querying the
-- Data API directly. The leaderboard view still counts them for everyone
-- because it runs with its owner's privileges (no security_invoker), which
-- bypasses RLS on public.points.

create or replace function public.admin_add_adjustment(
  p_user_id uuid,
  p_value   integer,
  p_reason  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin_add_adjustment: not admin';
  end if;
  if p_value is null or p_value = 0 then
    raise exception 'admin_add_adjustment: value must be a non-zero integer';
  end if;

  insert into public.points (user_id, week_start, value, category, reason, awarded_by)
  values (
    p_user_id,
    null,
    p_value,
    'manual_adjustment',
    coalesce(nullif(trim(p_reason), ''), 'Manual adjustment'),
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Category guard means a stray id can never delete a row from another
-- scoring category.
create or replace function public.admin_delete_adjustment(
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_delete_adjustment: not admin';
  end if;
  delete from public.points
   where id       = p_id
     and category = 'manual_adjustment';
end;
$$;

grant execute on function public.admin_add_adjustment(uuid, integer, text) to authenticated;
grant execute on function public.admin_delete_adjustment(uuid)             to authenticated;

-- Hide adjustment rows from non-admin reads. Every client query already
-- filters points by another category, so nothing user-facing changes; this
-- closes the direct-API path (e.g. supabase-js from the console).
drop policy if exists "points_read_authenticated" on public.points;
create policy "points_read_authenticated"
  on public.points for select
  to authenticated
  using (category <> 'manual_adjustment' or public.is_admin());
