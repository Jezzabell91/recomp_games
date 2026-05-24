-- Block blank notes from satisfying the auto-award trigger. The schema already
-- says note is NOT NULL; this also rules out '' / '   '.

alter table public.check_ins
  drop constraint if exists check_ins_note_nonempty;

alter table public.check_ins
  add constraint check_ins_note_nonempty
  check (length(trim(note)) > 0);
