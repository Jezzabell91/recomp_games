-- Ensure the standard Supabase roles have the right table-level grants.
-- RLS still gates what anon/authenticated can actually see or modify.
-- service_role bypasses RLS but still needs explicit GRANTs.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables    in schema public to anon;
grant select, insert, update, delete on all tables    in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Re-grant the leaderboard view explicitly (in case the above didn't cover the view)
grant select on public.leaderboard to anon, authenticated;

-- Make sure future tables created in public also get these grants by default.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
