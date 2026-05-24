-- Emoji reactions on weekly check-ins. Fixed 3-emoji picker; constraint
-- enforces the set so the UI can never insert anything else.

create table if not exists public.reactions (
  check_in_id  uuid not null references public.check_ins(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  emoji        text not null check (emoji in ('🔥', '💪', '👏')),
  created_at   timestamptz not null default now(),
  primary key (check_in_id, user_id, emoji)
);

alter table public.reactions enable row level security;

drop policy if exists "reactions_read_authenticated" on public.reactions;
create policy "reactions_read_authenticated"
  on public.reactions for select
  to authenticated using (true);

drop policy if exists "reactions_write_self" on public.reactions;
create policy "reactions_write_self"
  on public.reactions for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists "reactions_delete_self" on public.reactions;
create policy "reactions_delete_self"
  on public.reactions for delete
  to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.reactions to authenticated;
