# Recomp Games — Build Plan (Phase 1, to 1 June 2026)

> **For the reviewing agent:** this plan covers translating the design handoff in `design_handoff_recomp_games/` into the live app. Cross-reference against `STATUS.md` (current state + key decisions), `INDEX.md` (file-by-file inventory), `supabase/migrations/0001_init.sql` (current schema), and `design_handoff_recomp_games/README.md` (design tokens, screen specs, key design decisions). Sample components live in `design_handoff_recomp_games/recomp-shared.jsx`, `recomp-screens.jsx`, and `recomp-feed.jsx` — those are visual references, not import-ready code.

---

## Context the plan assumes

- **Stack:** Vite + React 18, HashRouter, Supabase (Postgres + Auth + Storage in Sydney), deployed to GitHub Pages at `recomp.games`.
- **Auth:** personal links via URL fragment (`#login=<base64(email:password)>`), session persists in localStorage. Already implemented in `lib/auth.js` + `context/AuthProvider.jsx`.
- **Participants:** 8 friends in Australia. 2 seeded (Jeremy admin, Andrew). 6 to come.
- **Challenge dates:** 1 June 2026 → 1 December 2026 (26 weeks). Week 1 = Mon 2026-06-01.
- **Week semantics:** `week_start` is the Monday (Brisbane) the week begins on. All Brisbane time reads go through `Intl.DateTimeFormat({ timeZone: 'Australia/Brisbane' })` — see `lib/dates.js` below. (Brisbane has no DST, so UTC+10 holds year-round, but we never hand-roll the offset.)
- **Photo privacy:** all 8 participants can view each other's photos. Leaderboard is public; everything else is auth-gated.

---

## Decisions log (resolved in planning)

| # | Decision | Implication |
|---|----------|-------------|
| 1 | Reactions ship in Phase 1 | New `reactions` table; fixed 3-emoji picker (no free emoji selection) |
| 2 | Check-in window is **Mon 00:00 → Sun 23:59 Brisbane** for the week starting that Monday. Only **Monday** submissions award the 5 points (with a 30-minute internal grace through Tue 00:30 Brisbane — see decision #3); submissions after that are accepted, recorded, and surfaced as "Late · 0 pts" everywhere they appear | One unique `check_ins` row per (user, week_start). The on-time flag is *derived*, not stored — the trigger is the single source of truth: `late = (no weekly_checkin points row exists for this check-in)`. Every UI surface that shows a "Late" tag must left-join `points` (category = 'weekly_checkin') rather than computing from `submitted_at` directly, so the 30-min grace can never disagree with what the leaderboard shows. Once next Monday rolls over and `currentWeekStart()` advances, the previous week's window is closed (the client always inserts with `week_start = currentWeekStart()`, so there's no way to backfill from the UI). **Diverges from handoff README key decision #6** (which hides the card Tue–Sun); we keep accepting Tue–Sun submissions so a missed Monday doesn't break a participant's weight history. |
| 3 | **Only on-time Monday check-ins auto-award 5 points** — late check-ins create the `check_ins` row but no `points` row. The Postgres trigger compares `NEW.submitted_at` (cast to Brisbane wall-clock) against `week_start + 1 day + 30 minutes`; if earlier, it inserts the 5. The 30-min grace is **internal** — users see "closes 11:59 PM Monday" everywhere — and exists purely so a Mon 23:59:55 submission that commits at Tue 00:00:02 (network + DB write latency) doesn't silently lose points. | Late check-ins are still valuable: they appear in Activity, populate Past Check-Ins, and keep the weight history continuous. They just don't score. `check_ins.note` gets a `length(trim(note)) > 0` check constraint so a blank note can never satisfy any check-in, on-time or late. The CheckIn page's "Late — won't score" banner is derived from `!isMondayInBrisbane()` and *also* shows during the 00:00–00:30 Tue grace window — so a user submitting then sees a late banner but actually gets the 5 points. Deliberate: the grace is for clock-skew commits, not for users gaming a 30-min window post-midnight, and the confirmation screen reads the truth from the points row. Add a one-line code comment in `CheckIn.jsx` so future-you doesn't "fix" the inconsistency. |
| 4 | The full scoring rubric (per landing page Quick Reference) has 7 sources: weekly check-in (130), fitness challenges (100), bonus stars (100), body comp (~80), push-up challenge (57), points steals (30), midpoint photos (15) | The `points` table is reshaped now (migration 0008 — `category` column, partial-unique on weekly check-in only) to accept any source without further schema work. Phase 1 only *uses* the weekly check-in category. |
| 5 | Admin portal is unlisted at `/admin` | No nav link anywhere; only Jeremy types the URL |
| 6 | Phase 1 Admin UI covers **only the weekly check-in category** — review the auto-awarded 5 per participant per week, override to a different value, or zero it out | Other categories (monthly challenges, body comp, push-up, bonus stars, steals, midpoint photos) get their own Admin sub-pages in later phases — each is a new UI surface against the already-categorised `points` table, not a schema migration. |
| 7 | **Pre-challenge "coming-soon" lockout** until Monday 2026-06-01 Brisbane | While `currentWeekStart() < CHALLENGE_START_YMD`, every `/app/*` route renders a centred "Challenge starts Mon 1 June" view instead of the normal UI. `/leaderboard` is reachable but shows zeros. `/admin` still works so you can prep. |
| 8 | Avatars are admin-managed via seed script using Messenger DPs | No avatar upload UI; `scripts/seed_users.mjs` uploads from a local `avatars/` folder. Avatars don't change mid-challenge except by re-running seed |
| 9 | Display name is read-only for participants | No profile editing surface at all |
| 10 | Landing page (`claude_recomp_games.tsx` at `/`) stays | Replaces the design's "Not Signed In" screen. Auth-gated routes redirect to `/` when no session |
| 11 | Reaction picker = fixed 🔥 💪 👏 | Schema check constraint enforces this; UI is a 3-button bottom sheet |
| 12 | "Starting photos" banner clears when all 3 (front/side/back) are uploaded | Not when the first one is uploaded |
| 13 | Final photos flow is punted to a later mini-phase | Schema table already exists; no UI work in Phase 1 |
| 14 | Weight gain is shown in neutral text color, never red/orange | Per `README.md` "Key Design Decisions" #1 |
| 15 | Activity feed uses Option C (timeline with day grouping) | Per `README.md` files list — Options A and B in `recomp-feed.jsx` are reference variants only |
| 16 | Leaderboard uses Option A (Clean) | Podium variant in `recomp-screens.jsx` is reference only |
| 17 | My Profile avatar shows no edit affordance | Diverges from design README #8. Reason: avatars are admin-managed via seed (decision #8); display name is read-only (decision #9); there's nothing for a participant to edit. |
| 18 | Avatars live in a separate **public** `avatars` Storage bucket | Body/scale photos stay in private `photos` bucket. Avatars become stable public URLs — no signed-URL refresh logic, no expiry footguns. |
| 19 | BottomNav is rendered on every authenticated route | iOS PWAs in standalone mode have no swipe-back gesture, so the nav must be the always-available escape hatch (including on Participant Profile, which the design says has no header back button). |

---

## Route map (final shape)

All routes are hash-based (HashRouter). `(auth)` means redirect to `/` if no session. `(pre-challenge gate)` means render the coming-soon view if `currentWeekStart() < CHALLENGE_START_YMD` (see decision #7).

| Path | Page | Notes |
|---|---|---|
| `/` | `claude_recomp_games.tsx` | Existing landing page. Two additions: a "View leaderboard →" link near the bottom, and a "Got a personal link? Paste it here" text input that runs the link through the same `#login=…` parse path as the URL fragment. The paste input exists for iOS-standalone PWA users (see Phase 5 → PWA) whose installed app can't see the Safari session — they need a way to re-auth without an editable URL bar. |
| `/app` | `pages/Home.jsx` | (auth, pre-challenge gate) Participant dashboard. |
| `/app/checkin` | `pages/CheckIn.jsx` | (auth, pre-challenge gate) Available Mon–Sun Brisbane. 2-step wizard + confirmation. Shows a "Late — won't count for 5 pts" banner when entered Tue–Sun. Redirects to `/app` only if already checked in for the current week. |
| `/app/initial-photos` | `pages/InitialPhotos.jsx` | (auth, pre-challenge gate) 3-step wizard (front/side/back) + done screen. |
| `/activity` | `pages/Activity.jsx` | (auth, pre-challenge gate) Timeline feed, all participants this week. |
| `/leaderboard` | `pages/Leaderboard.jsx` | Public (no auth). Pre-challenge: still renders, all zeros. Bottom nav only renders when session is present. |
| `/profile` | `pages/MyProfile.jsx` | (auth, pre-challenge gate) Own profile. |
| `/profile/:userId` | `pages/ParticipantProfile.jsx` | (auth, pre-challenge gate) Someone else's profile. No header back button (per design). BottomNav **always rendered** with no tab active — it is the only way back, since iOS PWAs in standalone mode have no swipe-back gesture. |
| `/admin` | `pages/Admin.jsx` | (auth + admin, **no** pre-challenge gate) Unlisted. Reachable pre-launch so Jeremy can prep. |

A `<RequireAuth>` wrapper component handles the redirect. `<RequireAdmin>` for `/admin`. A `<RequireChallengeStarted>` wrapper renders the coming-soon view in place of `children` when the challenge hasn't begun yet (see Phase 0).

---

## Phase 0 — Foundation

**Goal:** schema bumps, fonts, theme tokens, time helpers, and routing skeleton in place. Nothing user-visible changes yet.

### Schema migrations

`supabase/migrations/0004_user_colors.sql`:

```sql
-- Just add the column with a default. Per-user colors are owned by
-- scripts/seed_users.mjs — single source of truth, so adding the other six
-- participants later doesn't require another migration. Re-running seed
-- rewrites this column for every user in the USERS array.
alter table public.users
  add column if not exists color text not null default '#FFD700';
```

`supabase/migrations/0005_reactions.sql`:

```sql
create table if not exists public.reactions (
  check_in_id  uuid not null references public.check_ins(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  emoji        text not null check (emoji in ('🔥', '💪', '👏')),
  created_at   timestamptz not null default now(),
  primary key (check_in_id, user_id, emoji)
);

alter table public.reactions enable row level security;

create policy "reactions_read_authenticated"
  on public.reactions for select
  to authenticated using (true);

create policy "reactions_write_self"
  on public.reactions for insert
  to authenticated with check (user_id = auth.uid());

create policy "reactions_delete_self"
  on public.reactions for delete
  to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.reactions to authenticated;
```

`supabase/migrations/0006_avatars_bucket.sql`:

```sql
-- Create a separate public bucket for avatars. Body/scale photos stay private in `photos`.
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;

drop policy if exists "avatars_read_public"          on storage.objects;
drop policy if exists "avatars_insert_owner_or_admin" on storage.objects;
drop policy if exists "avatars_update_owner_or_admin" on storage.objects;
drop policy if exists "avatars_delete_owner_or_admin" on storage.objects;

-- Read: anyone (incl. anon) — bucket is public, but we add an explicit policy so RLS is consistent.
create policy "avatars_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Write: owner can write `<uid>.jpg`; admin can write anything in the bucket.
-- The owner-write rule is intentionally permissive for a future Phase 2
-- "let participants change their own avatar" surface. In Phase 1 only the
-- seed script (service role, bypasses RLS) ever writes here.
create policy "avatars_insert_owner_or_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      name = auth.uid()::text || '.jpg'
      or public.is_admin()
    )
  );

create policy "avatars_update_owner_or_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  )
  with check (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  );

create policy "avatars_delete_owner_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (name = auth.uid()::text || '.jpg' or public.is_admin())
  );
```

`supabase/migrations/0007_leaderboard_color.sql`:

```sql
-- Recreate the leaderboard view to include each user's color (needed for progress bars).
create or replace view public.leaderboard as
select
  u.id              as user_id,
  u.display_name,
  u.avatar_url,
  u.color,
  coalesce(sum(p.value), 0)::int    as total_points,
  count(distinct c.week_start)::int as weeks_checked_in
from public.users u
left join public.points p   on p.user_id = u.id
left join public.check_ins c on c.user_id = u.id
group by u.id, u.display_name, u.avatar_url, u.color
order by total_points desc, weeks_checked_in desc;

grant select on public.leaderboard to anon, authenticated;
```

`supabase/migrations/0008_points_categories.sql`:

```sql
-- Reshape `points` to accept all scoring categories from the landing-page rubric.
-- Phase 1 only writes `weekly_checkin` rows (via trigger below); other categories
-- are inserted by future admin sub-pages without further schema changes.

alter table public.points
  add column if not exists category text not null default 'weekly_checkin'
    check (category in (
      'weekly_checkin',     -- 5 pts auto-awarded for valid Monday check-in (26 × 5 = 130 max)
      'monthly_challenge',  -- fitness challenges, 25 × 4 = 100 max
      'bonus_star',         -- revealed at finale, 20 × 5 = 100 max
      'body_comp',          -- final-scan deltas, ~80 max
      'push_up_daily',      -- daily push-up bonuses during June
      'push_up_final',      -- push-up challenge result
      'points_steal',       -- 3 tokens × 10 pts each
      'midpoint_photos',    -- September progress photos
      'manual_adjustment'   -- escape hatch
    ));

-- week_start is only meaningful for weekly_checkin (and possibly push_up_daily later).
-- For finale categories like bonus_star or body_comp, it's null.
alter table public.points alter column week_start drop not null;

-- Drop the old "one row per user per week" constraint — multiple categories
-- can pay out in the same week.
alter table public.points drop constraint if exists points_user_id_week_start_key;

-- Replace with a partial unique: at most one weekly_checkin row per (user, week).
-- Lets the trigger use ON CONFLICT to stay idempotent.
create unique index if not exists points_weekly_checkin_unique
  on public.points (user_id, week_start)
  where category = 'weekly_checkin';

-- Trigger function: award 5 points on every successful check_ins insert if
-- the submission landed before 00:30 Brisbane on the day after week_start.
-- Late check-ins create the check_ins row but no points row.
-- `at time zone 'Australia/Brisbane'` converts the timestamptz to a Brisbane
-- wall-clock timestamp; we then compare against the cutoff Brisbane wall-clock.
-- Relies on the function owner (postgres in Supabase) having BYPASSRLS so the
-- insert into public.points (which has admin-only RLS) succeeds. `security
-- definer` only sets the role; the BYPASSRLS attribute does the actual work.
create or replace function public.award_weekly_checkin_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitted_brisbane timestamp;
  cutoff_brisbane    timestamp;
begin
  submitted_brisbane := NEW.submitted_at at time zone 'Australia/Brisbane';
  -- 00:30 Brisbane on the day AFTER week_start. The 30-minute grace past
  -- midnight is internal — users are told "closes 11:59 PM Monday" — and
  -- exists purely so a 23:59:55 Mon submit that commits at 00:00:02 Tue
  -- (network + DB write latency) doesn't silently lose its 5 points.
  cutoff_brisbane := (NEW.week_start + 1)::timestamp + interval '30 minutes';
  if submitted_brisbane < cutoff_brisbane then
    insert into public.points (user_id, week_start, value, category, reason, awarded_by)
    values (NEW.user_id, NEW.week_start, 5, 'weekly_checkin',
            'Auto-awarded for Monday check-in', null)
    on conflict (user_id, week_start) where category = 'weekly_checkin' do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_weekly_checkin on public.check_ins;
create trigger trg_award_weekly_checkin
  after insert on public.check_ins
  for each row execute function public.award_weekly_checkin_points();
```

`supabase/migrations/0009_checkin_note_nonempty.sql`:

```sql
-- Block blank notes from satisfying the auto-award trigger. The schema already
-- says note is NOT NULL; this also rules out '' / '   '.
alter table public.check_ins
  drop constraint if exists check_ins_note_nonempty;

alter table public.check_ins
  add constraint check_ins_note_nonempty
  check (length(trim(note)) > 0);
```

`supabase/migrations/0010_admin_rpcs.sql`:

```sql
-- PostgREST's `on_conflict` query parameter only takes column names; it cannot
-- pass through a WHERE predicate. So `.upsert({ onConflict: 'user_id,week_start' })`
-- generates `ON CONFLICT (user_id, week_start)` with no WHERE — and Postgres index
-- inference can't match our partial unique on `category = 'weekly_checkin'`, so the
-- call fails with "no unique or exclusion constraint matching the ON CONFLICT
-- specification." Wrap the raw upsert in a SECURITY DEFINER RPC the admin calls
-- via supabase.rpc('admin_set_weekly_points', { ... }).

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
  -- Belt-and-braces: RLS on points already rejects non-admin writes, but checking
  -- here gives a clearer error and avoids running the upsert.
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

-- Companion for the "✕" delete button on the admin row: removes the weekly_checkin
-- row entirely (different from setting value to 0, which records an explicit zero).
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
grant execute on function public.admin_clear_weekly_points(uuid, date) to authenticated;
```

All seven migrations are idempotent. Run in order via Supabase SQL editor.

### Fonts

In `index.html`, inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
```

### Theme tokens

`lib/theme.js` — extract the `rcTheme()` function from `recomp-shared.jsx`. Export the token map directly (drop the `dark`/`light` branching — we only ship dark). Reference, do not duplicate, in components.

### Time helpers

`lib/dates.js` — read Brisbane wall-clock fields via `Intl.DateTimeFormat`, not by manually adding 10h to a UTC `Date` (that produces a "lying" Date whose UTC fields look like Brisbane fields but break on serialization and comparison).

```js
const TZ = 'Australia/Brisbane';
const CHALLENGE_START_YMD = '2026-06-01'; // Monday, week 1

// Read Brisbane Y/M/D/weekday from a Date (default: now). Returns plain ints + ISO weekday (1=Mon..7=Sun).
// Every helper below that depends on "now" threads through an optional `now`
// param so the sanity script can assert behaviour at fixed timestamps. Don't
// remove the optional arg — without it, the helpers can't be tested without
// monkey-patching Date.now.
function brisbaneParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(date);
  const get = (t) => parts.find(p => p.type === t).value;
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    year:  Number(get('year')),
    month: Number(get('month')),
    day:   Number(get('day')),
    isoWeekday: weekdayMap[get('weekday')],
  };
}

export function todayInBrisbaneYMD(now = new Date()) {
  const { year, month, day } = brisbaneParts(now);
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function isMondayInBrisbane(now = new Date()) {
  return brisbaneParts(now).isoWeekday === 1;
}

// Monday on or before "today in Brisbane". Returns 'YYYY-MM-DD'.
export function currentWeekStart(now = new Date()) {
  const { year, month, day, isoWeekday } = brisbaneParts(now);
  // Construct a UTC date for today's Brisbane Y-M-D, then subtract (isoWeekday-1) days.
  // We use UTC arithmetic here purely as a calendar — no timezone semantics attached.
  const utc = Date.UTC(year, month - 1, day);
  const monday = new Date(utc - (isoWeekday - 1) * 86400000);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const d = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function ymdToUTC(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function weekNumber(weekStartYMD) {
  // weekStartYMD and CHALLENGE_START_YMD are both Mondays — diff is a whole number of weeks.
  // Clamp at 1: any week_start at or before the challenge start counts as "Week 1" for display.
  const diffWeeks = Math.round((ymdToUTC(weekStartYMD) - ymdToUTC(CHALLENGE_START_YMD)) / (7 * 86400000));
  return Math.max(1, diffWeeks + 1);
}

export function weekRangeLabel(weekStartYMD) {
  // "5–11 Aug" when the week stays in one month, "29 Jul–4 Aug" when it crosses.
  const startUTC = ymdToUTC(weekStartYMD);
  const start = new Date(startUTC);
  const end   = new Date(startUTC + 6 * 86400000);
  const fmt = (dt, opts) =>
    new Intl.DateTimeFormat('en-AU', { timeZone: 'UTC', ...opts }).format(dt);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const startStr = sameMonth
    ? String(start.getUTCDate())
    : fmt(start, { day: 'numeric', month: 'short' });
  const endStr = fmt(end, { day: 'numeric', month: 'short' });
  return `${startStr}–${endStr}`;
}

// Format a 'YYYY-MM-DD' as 'Mon 1 Jun 2026' for human display. Used by the
// ComingSoon view and anywhere else CHALLENGE_START_YMD or a week_start needs
// to render as a single calendar date (vs. weekRangeLabel which renders a range).
// Anchored at UTC noon so any locale-side TZ read can't shift the date.
export function formatYMDForDisplay(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).format(dt);
}

export function totalWeeks() { return 26; }

export function isBeforeChallengeStart(now = new Date()) {
  // True while the current Brisbane Monday is strictly earlier than the challenge start.
  return currentWeekStart(now) < CHALLENGE_START_YMD; // YYYY-MM-DD strings sort lexicographically
}

export { CHALLENGE_START_YMD };
```

All comparisons that affect UI state (card visibility, "is it Monday?", week number) must read Brisbane fields via `brisbaneParts()`. Store `week_start` as `YYYY-MM-DD` strings (matches `check_ins.week_start` Postgres `date` column).

### Sanity-check script for `lib/dates.js`

`scripts/sanity-dates.mjs` — a 30-line script that asserts the helpers on a fixed set of timestamps. Correctness here matters more than anywhere else: a bug in `currentWeekStart()` would silently misalign every check-in for the whole challenge. Run with `node scripts/sanity-dates.mjs` after any edit to `lib/dates.js`. All "now-dependent" helpers (`currentWeekStart`, `isMondayInBrisbane`, `todayInBrisbaneYMD`, `isBeforeChallengeStart`) take an optional `now` Date so assertions are direct — no `Date.now` monkey-patching.

Assertions (at minimum, using the explicit `now` arg form; `+10:00` is the Brisbane offset, no DST):
- `currentWeekStart(new Date('2026-06-01T00:01:00+10:00')) === '2026-06-01'`, `isMondayInBrisbane(new Date('2026-06-01T00:01:00+10:00')) === true`, `weekNumber('2026-06-01') === 1`.
- `currentWeekStart(new Date('2026-06-01T23:59:00+10:00')) === '2026-06-01'`, `isMondayInBrisbane(new Date('2026-06-01T23:59:00+10:00')) === true` (still Monday Brisbane).
- `currentWeekStart(new Date('2026-06-02T00:01:00+10:00')) === '2026-06-01'`, `isMondayInBrisbane(new Date('2026-06-02T00:01:00+10:00')) === false`.
- `currentWeekStart(new Date('2026-06-07T23:59:00+10:00')) === '2026-06-01'`, `isMondayInBrisbane(new Date('2026-06-07T23:59:00+10:00')) === false`.
- `currentWeekStart(new Date('2026-06-08T00:00:00+10:00')) === '2026-06-08'`, `weekNumber('2026-06-08') === 2`.
- `currentWeekStart(new Date('2026-05-24T12:00:00+10:00')) === '2026-05-18'`, `isBeforeChallengeStart(new Date('2026-05-24T12:00:00+10:00')) === true`, `weekNumber('2026-05-18') === 1` (clamped, not -2).
- `weekRangeLabel('2026-06-01') === '1–7 Jun'`, `weekRangeLabel('2026-08-31') === '31 Aug–6 Sep'`.
- `formatYMDForDisplay('2026-06-01')` — `Intl` output is locale-dependent (en-AU in some Node versions emits `'Mon, 1 Jun 2026'` with comma, others without). On first run, log the value and lock the assertion to whatever the runtime actually produces, so the script catches *future* regressions rather than failing on day one.

### Routing skeleton

Update `main.jsx` to the route map above. Add `components/RequireAuth.jsx` and `components/RequireAdmin.jsx`.

`<RequireAuth>` must read `{ session, loading }` from `useAuth()` and:
- While `loading === true` → render a neutral splash (centered ★ logo on `bg` gradient, no text). **Do not redirect yet** — on first paint, Supabase hasn't hydrated the session from localStorage, so an early redirect would bounce already-signed-in users to `/`.
- When `loading === false && !session` → `<Navigate to="/" replace>`.
- Otherwise render `children`.

`<RequireAdmin>` wraps `<RequireAuth>` and additionally redirects to `/app` if `profile.is_admin !== true`.

`<RequireChallengeStarted>` wraps `<RequireAuth>` and renders `<ComingSoon />` in place of `children` when `isBeforeChallengeStart()` is true. Applied to every `/app/*`, `/activity`, and `/profile/*` route. **Not** applied to `/admin` (Jeremy needs access pre-launch) or `/leaderboard` (public, harmless when empty).

`components/ComingSoon.jsx` — centred view, dark gradient bg, ★ logo, "The Recomp Games" title, big `Starts {formatYMDForDisplay(CHALLENGE_START_YMD)}` line (renders as "Starts Mon 1 Jun 2026"), secondary hint "Starting photos + first check-in open Mon 1 June 📷" (makes it explicit that the photo upload flow unlocks *on* launch day, not before — avoids the "told to prep, then bounced" UX when participants tap into the app pre-launch), no other UI. No bottom nav. The launch date is *never* hard-coded in this component — it always flows through `formatYMDForDisplay(CHALLENGE_START_YMD)` so it can never drift from the constant if the launch date moves.

### Seed script update

`scripts/seed_users.mjs`:

- Accept a `color` field per user in the `USERS` array.
- Look for `./avatars/<email-local-part>.jpg` (e.g. `./avatars/jeremy.bell91.jpg`).
- Upload to the **public `avatars` bucket** at `<user_id>.jpg` (flat layout, one file per user, `upsert: true`).
- Write the bucket's stable public URL into `public.users.avatar_url`:
  `${VITE_SUPABASE_URL}/storage/v1/object/public/avatars/<user_id>.jpg`. Append a cache-buster query (`?v=<timestamp>`) so re-seeded avatars invalidate immediately.
- Re-running rotates passwords AND replaces avatars (idempotent overwrite). Skip avatar upload if the local file is missing — leave existing `avatar_url` alone.

The 8 participants and their colors (from `design_handoff_recomp_games/README.md`):

| Name | Email | Color | Admin |
|---|---|---|---|
| Lachie | TBD | `#4FC3F7` | |
| Jeremy | jeremy.bell91@gmail.com | `#FFD700` | yes |
| Brodie | TBD | `#66BB6A` | |
| Tom | TBD | `#FF7043` | |
| Mitch | TBD | `#AB47BC` | |
| Dan | TBD | `#26C6DA` | |
| Andrew | andrew-bell@hotmail.com | `#EF5350` | |
| Sam | TBD | `#FFA500` | |

---

## Phase 1 — Shared UI kit

**Goal:** every primitive component the screens depend on, ported to proper React.

Folder: `components/ui/`. Each component takes props instead of pulling from `window.RECOMP`. Inline `style={{...}}` is fine for now — matches the handoff and is easy to diff against. Refactor to CSS modules later only if needed.

| File | Source in handoff | Props |
|---|---|---|
| `Avatar.jsx` | `RCAvatar` | `name`, `color`, `size = 36`, `src?` (if `avatar_url` present, render `<img>` instead of initial) |
| `Button.jsx` | `RCBtn` | `variant = 'primary'\|'secondary'`, `full`, `small`, `disabled`, `onClick`, `children` |
| `Card.jsx` | `RCCard` | `accent?`, `glow?`, `children` |
| `Banner.jsx` | `RCBanner` | `accent`, `icon`, `onClick`, `children` |
| `StepDots.jsx` | `RCStepDots` | `step`, `total` |
| `AppBar.jsx` | `RCAppBar` | `userName`, `avatarSrc?`, `avatarColor` |
| `BottomNav.jsx` | `RCBottomNav` | `active = 'home'\|'activity'\|'leaderboard'\|'profile'\|''`. Uses `<NavLink>` from react-router. |
| `WeightSparkline.jsx` | `RCWeightProgress` | `history` (array of `{week, weight}`), `start`, `current`, `color` |
| `Page.jsx` | n/a (composed) | Layout wrapper: dark gradient bg, optional `<AppBar>`, scrollable content slot, optional `<BottomNav>` |
| `ReactionPills.jsx` | `FeedReactions` (from `recomp-feed.jsx`) | `reactions` (`{emoji: count}`), `myReactions` (Set of emojis you reacted with), `onToggle(emoji)` |
| `WeightBadge.jsx` | `FeedWeightBadge` | `change` (number, negative = loss) |

Components consume the theme via `lib/theme.js`; no `theme` prop drilling.

---

## Phase 2 — Core participant flows

**Goal:** initial photos + weekly check-in + Home — the must-haves for 1 June.

### `lib/upload.js`

Single utility, ~50 lines:

```js
export async function resizeAndUpload(file, storagePath, { maxDim = 1280, quality = 0.85 } = {}) {
  // 1. Read file into <img>
  // 2. Draw to canvas scaled so max(width,height) === maxDim
  // 3. canvas.toBlob('image/jpeg', quality)
  // 4. supabase.storage.from('photos').upload(storagePath, blob, { upsert: true })
  // 5. Return { path: storagePath, error }
}

export async function signedUrl(path, expiresIn = 60 * 60 * 24) {
  // supabase.storage.from('photos').createSignedUrl(path, expiresIn)
}
```

Used by both photo flows. Photos hit ~150KB after resize — fast even on 4G.

### `pages/InitialPhotos.jsx`

- Single route `/app/initial-photos` with `?pose=front|side|back` query param (default `front`).
- Three steps; `<StepDots step={n} total={3}>`.
- `<input type="file" accept="image/*" capture="environment">` — opens camera on mobile, file picker on desktop.
- On capture: `resizeAndUpload(file, '<user_id>/initial/<pose>.jpg')` → upsert row in `initial_photos` (table has `unique (user_id, pose)`).
- "Skip for now — come back anytime" advances to next pose without uploading.
- After back step, OR if `initial_photos` already has 3 rows for the user → show the Done screen (`💪 Starting photos saved!`) with 3 thumbnails. CTA "Back to Home" → `/app`.
- Privacy note "Viewable by other participants" (no lock icon, per design decision #7 in handoff README).
- **Error contract** (mirrors CheckIn): upload first; on upload error show inline error and preserve the captured photo, no `initial_photos` insert. On insert error after a successful upload, best-effort `storage.remove([path])` and show inline error. The `unique (user_id, pose)` constraint means a retried successful upload-then-insert path overwrites cleanly via `upsert: true` on the storage call.

### `pages/CheckIn.jsx`

- Route `/app/checkin` with `?step=1|2` (default 1).
- **Guard at mount:** if a `check_ins` row already exists for `(me, currentWeekStart())` → `<Navigate to="/app">` (Home shows the confirmed card). No day-of-week guard — submission is open Mon–Sun for the current `week_start`.
- **Late banner** (rendered above step 1 and step 2 when `!isMondayInBrisbane()`):
  - Neutral (not amber, not error) accent strip: "Late check-in · this won't score the 5 points but will still appear in your history and Activity feed."
  - Not blocking; the form works normally.
- **Step 1 (Scale photo):** capture flow identical to initial photos. Stores file in local state (not uploaded yet) so user can go Back from step 2 without losing it.
- **Step 2 (Weight + note):**
  - Big "84.5" display backed by a hidden `<input type="number" inputMode="decimal" step="0.1">`. Tap the number to focus the input. **Do not pre-fill** — the field starts empty and the user must type today's reading. Submit button stays disabled until a value is entered.
  - Submit also disabled while `note.trim().length === 0` — the DB check constraint would reject it anyway, but blocking client-side avoids a confusing 400.
  - Last-week comparison pill: query the most recent prior `check_ins` row for this user (`order by week_start desc limit 1`), compute delta. Always neutral color regardless of direction (design decision). **Hide the pill entirely if no prior check-in exists** (e.g. week 1, or anyone who skipped earlier weeks and has no history).
  - Note `<textarea>` with 280-char limit + live count in bottom-right.
  - Footer: `← Back` (flex 1) + `Submit ✓` (flex 2) — label stays "Submit ✓" in both on-time and late cases.
- **On submit:**
  0. **Re-read `const weekStart = currentWeekStart()` inside the submit handler — *not* a value captured at component mount.** A user lingering on the form across Sun 23:59 → Mon 00:01 Brisbane would otherwise insert with the *previous* Monday's date, the trigger would no-op the points award (the row lands against last week's window), AND they'd be locked out of *this* Monday's check-in (Home's guard reads the fresh `currentWeekStart()` and shows the pending card on a route they think they just completed). Use `weekStart` in both the upload path and the insert below.
  1. Upload scale photo to `<user_id>/checkin/<weekStart>/scale.jpg`.
  2. Insert into `check_ins` (`user_id`, `week_start = weekStart`, `scale_photo_path`, `weight_kg`, `note`) — capture the returned row's `id`.
  3. **The `trg_award_weekly_checkin` Postgres trigger fires in the same transaction.** It checks `(submitted_at at time zone 'Australia/Brisbane')::date == week_start` and only inserts the 5-point `weekly_checkin` row on a Monday submission. Late submissions create no points row. The client doesn't need to branch — the trigger handles it.
  4. **Re-read the row joined to its points row to decide the confirmation variant — do not infer from `isMondayInBrisbane()`.** The trigger is the source of truth; the client must reflect it. Without this round trip, clock skew between phone and Postgres at a late-Monday-night submission can make the UI say "+5 pts" when no points row exists (or vice-versa). Query:

    ```sql
    select c.id, c.week_start, c.weight_kg, c.note, c.scale_photo_path, c.submitted_at,
           p.value as awarded_value
      from check_ins c
      left join points p
        on p.user_id = c.user_id
       and p.week_start = c.week_start
       and p.category = 'weekly_checkin'
     where c.id = $newId;
    ```
  5. Navigate to confirmation screen (renders inline, not a separate route — same component, conditional view) with the joined row in state.
- **Error contract** for the submit sequence:
  - **Upload fails** (network, storage error): show inline error above the Submit button, preserve all form state (photo blob in local state, weight, note), no DB insert attempted, no orphan blob. User can retry without re-capturing.
  - **Insert fails after upload succeeded**: best-effort `supabase.storage.from('photos').remove([path])` to delete the orphan blob, then show inline error and preserve form state. If the cleanup `remove()` itself errors, swallow it — the orphan blob is harmless (next-week's submission overwrites the path via `upsert: true`).
  - **Re-read fails after insert succeeded**: the check-in *was* recorded — don't show an error. Navigate to confirmation with `awarded_value: null` and a small "couldn't fetch points status, refresh Home in a moment" line. Home's own query will resolve it.
- **Confirmation** (two variants, picked from `awarded_value != null` on the re-read row — *not* from `isMondayInBrisbane()`):
  - Awarded (points row exists) → 🔥 emoji + "Locked in! +{awarded_value} pts" (accent / green) + summary card with photo thumbnail, weight, note. Using `awarded_value` instead of hard-coding `5` also future-proofs against any later trigger change.
  - Not awarded (no points row) → ⏰ emoji + "Locked in · late check-in" + small "Didn't score the 5 pts, but your weight + note are saved" line + summary card. Same "Back to Home" CTA.

### `pages/Home.jsx` (full rewrite)

Sections, top to bottom:

1. `<AppBar>` (★ RECOMP + own avatar).
2. **Greeting:** "Hey, {display_name} 👋" + "Week X of 26" + progress bar.
3. **Check-in card** (rendered in one of four modes, picked in this order). "Checked in this week" is derived by joining the check-in row to its `points` row: `awarded5 = hasCheckedInThisWeek && pointsRowExistsForThisWeek`.
   - `hasCheckedInThisWeek && awarded5` → **green confirmed card** showing this week's weight/note + "+5 pts" pill. Stays for the full week, flips back to pending next Monday.
   - `hasCheckedInThisWeek && !awarded5` → **neutral confirmed-late card** showing this week's weight/note + small "Late check-in · no points this week" line in `textSec`. Same layout as the green card but accent stripped — communicates "yes, you're done for this week, but it didn't score". No CTA.
   - `!hasCheckedInThisWeek && isMondayInBrisbane()` → **pending Monday card**: ⏳ "Check-in not submitted", subtext "Window closes tonight 23:59 AEST · +5 pts", "Submit Check-In" CTA → `/app/checkin`.
   - `!hasCheckedInThisWeek && !isMondayInBrisbane()` → **pending late card**: ⏰ "Monday window missed", subtext "You can still submit — counts in your history, no points this week", secondary-styled "Submit Late Check-In" CTA → `/app/checkin`. Distinct from the on-time pending card (no urgency, no "+5 pts" promise) so the user understands what they're getting.
4. **Initial photos banner** (conditional): visible only when `count(initial_photos for self) < 3`. Links to `/app/initial-photos`. Clears once all 3 uploaded.
5. **Mini leaderboard:** top 3 from `leaderboard` view + "You're #X with Y points" accent pill. "See all →" → `/leaderboard`.
6. **Past Check-Ins:** own `check_ins` (left-joined to the `weekly_checkin` points row) ordered `week_start desc`, latest 5. Each row: week label, weight (accent), note. Append a small "Late" tag (textMut, no accent) when the joined points row is null — same single-source-of-truth derivation Activity and the Home check-in card use, so the 30-min Tue 00:30 trigger grace can't cause UI disagreement. Use the same `<PastCheckInList>` component on My Profile so the tag is consistent everywhere.
7. `<BottomNav active="home">`.

Queries needed:
- `select c.*, p.value as awarded_value from check_ins c left join points p on p.user_id = c.user_id and p.week_start = c.week_start and p.category = 'weekly_checkin' where c.user_id = $me order by c.week_start desc limit 5` (drives Past Check-Ins and the "Late" tag derivation)
- `select count(*) from initial_photos where user_id = $me`
- `select * from leaderboard limit 3` + the row for me (or fetch all and slice — only 8 rows)

---

## Phase 3 — Social

### `pages/Activity.jsx`

Timeline (Option C from `recomp-feed.jsx`).

- Header: "Activity" + "Week X check-ins".
- Query (single round trip if possible):

  ```sql
  select
    c.id, c.user_id, c.week_start, c.weight_kg, c.note, c.submitted_at, c.scale_photo_path,
    u.display_name, u.color, u.avatar_url,
    p.value as awarded_value
  from check_ins c
  join users u on u.id = c.user_id
  left join points p
    on  p.user_id    = c.user_id
    and p.week_start = c.week_start
    and p.category   = 'weekly_checkin'
  where c.week_start = $current_week_start
  order by c.submitted_at desc;
  ```

  The `left join points` is the canonical "did this check-in score?" source — `awarded_value is null` ⇒ render the "Late · 0 pts" pill, otherwise on-time. Don't re-derive lateness from `submitted_at` vs `week_start` in the client; the 30-min Tue 00:30 grace (decision #3) lives only in the trigger, and re-implementing it in the UI guarantees they'll disagree one day.

- Compute `change` per row by looking up each user's **most recent prior check-in** — *not* the literal previous week. Skipped weeks would otherwise produce a null delta on the next check-in (e.g. user skips week 3, submits week 4, the `where week_start = 2026-06-15` query finds nothing even though they have a week-2 row to compare against). One round trip, batched across all users:

  ```sql
  select distinct on (user_id) user_id, weight_kg, week_start
    from check_ins
   where week_start < $current_week_start
   order by user_id, week_start desc;
  ```

  Returns at most one row per user. Build a `{ userId: { weight_kg, week_start } }` map and join client-side; missing keys (week-1 newcomers, or anyone whose first check-in was deferred until late in the challenge) render with no change badge — same code path the CheckIn page already uses for its last-week pill.
- Fetch reactions in bulk: `select check_in_id, user_id, emoji from reactions where check_in_id in (...)`. Aggregate client-side into `{checkInId: {emoji: count}}` and also a `{checkInId: Set<emoji>}` for "did I react with this".
- **Sign scale-photo URLs in one round trip:** `supabase.storage.from('photos').createSignedUrls(paths, 60 * 60 * 24)` (plural — takes an array, returns an array). Calling the singular `createSignedUrl` per row would be 8 sequential round trips on every Activity render and feel noticeably sluggish on mobile data. The plural form is one round trip. Apply the same rule to Admin's per-week view and any other surface that signs multiple photos at once.
- Group items by **Brisbane calendar date** of `submitted_at` (not rolling 24h windows — a Mon 11pm submission must stay in TODAY's bucket until Brisbane midnight, not roll to YESTERDAY at 1am Tuesday):
  - TODAY: Brisbane Y-M-D equals `todayInBrisbaneYMD()`
  - YESTERDAY: Brisbane Y-M-D equals yesterday's Brisbane date
  - EARLIER: anything older
  - Use `lib/dates.js` helpers; do not derive these from `new Date()` directly.
- Each item renders: avatar with timeline connector line, name + relative time + **"Late · 0 pts" pill** when `awarded_value is null` on the joined row (small chip, `textMut` color, no accent — matches the "no urgency" framing on Home). On-time items show no pill (or a quiet "+5" pill — pick one, don't show both). Then weight + `<WeightBadge>`, scale photo thumbnail (64×48, signed URL — batched via `createSignedUrls`), note, `<ReactionPills>`.
- Tapping name/avatar → `/profile/:userId`.
- `+` button on reactions opens a small inline 3-emoji picker (🔥 💪 👏). Tap an emoji → insert into `reactions` (or delete if already there). Optimistic update.

### `pages/MyProfile.jsx`

- Header (no edit pencil): avatar (72px) + name + "Rank #X · Week Y of 26".
- **Rank computation** (used here and on Participant Profile): the `leaderboard` view returns all 8 rows ordered by `total_points desc`. Compute `rank = rows.findIndex(r => r.user_id === targetUserId) + 1`. No SQL `rank()` window — 8 rows, do it client-side. Cache the result in component state keyed on `userId`. Ties resolve by `weeks_checked_in desc` (already part of the view's ORDER BY); a `dense_rank`-style "shared 3rd" display is overkill for 8 people.
- Stats row: Points / Rank / Check-ins. Same component used in Participant Profile.
- `<WeightSparkline>` from own `check_ins` history.
- Starting photos thumbnails (3 slots, 3:4 aspect, signed URLs). No retake button.
- Recent check-ins (reuse list from Home — extract `<PastCheckInList items={...}>`).
- `<BottomNav active="profile">`.

### `pages/ParticipantProfile.jsx`

Route `/profile/:userId`.

- **No back button** — design explicitly says navigate via swipe gesture or bottom nav.
- Hero, no edit affordance.
- Stats row.
- `<WeightSparkline>` with `color={participant.color}`.
- **Activity grid:** 13-column CSS grid, 26 cells. For each of the 26 Mondays from 2026-06-01:
  - If that week's `check_ins` row exists for this user → filled with `participant.color + '55'`.
  - Else if it's the current week → 2px accent border + small dot.
  - Else → dim background.
- Legend: "Checked in / Missed / Now".
- `<BottomNav active="">` (no tab active per design decision #4 in handoff README).

---

## Phase 4 — Leaderboard polish + Admin

### `pages/Leaderboard.jsx` (rewrite)

- Use the Clean layout (Option A) from `recomp-screens.jsx`.
- The `leaderboard` view now includes `color` (migration 0007), so a single `select * from leaderboard` is enough — no client-side join.
- Each row: rank (medal colors for top 3), avatar, name (with YOU badge if `isYou`), per-user progress bar at 50% opacity in their color, points, "X/26 wks".
- Tap a row → `/profile/:userId` if not me, `/profile` if me.
- Public route: `<BottomNav>` only renders if `session` is present. Signed-out users see a "← Back to home" link instead.

### `pages/Admin.jsx`

- Guarded by `<RequireAdmin>`. Unlisted. **No** pre-challenge gate — Jeremy needs access to seed and verify before launch.
- Phase 1 scope: a single "Weekly Check-Ins" tab. The other 6 scoring categories (monthly challenges, body comp, push-up, bonus stars, points steals, midpoint photos) get their own tabs in later phases — the `points.category` column is already there waiting.
- **Layout:** tabs across the top (`Weekly Check-Ins` is the only live one in Phase 1; render the rest as disabled tabs with a "Phase 2" badge so the surface area is visible). Below the tabs, a week selector defaults to `currentWeekStart()` and can pick any past week.
- **For the selected week:**
  - Query all `users`, left-join `check_ins` (for the week) and the matching `points` row (`category = 'weekly_checkin'` for that `week_start`).
  - Sign all scale-photo URLs in one round trip via `createSignedUrls` (see Activity section).
  - Render one row per participant:
    - Avatar + name
    - **Status badge** — "Submitted Mon 14:32 ✓" (green) when the matching `weekly_checkin` points row exists (the trigger awarded), "Late · 3d" when the check-in exists but no points row (delay days computed via `brisbaneParts(submitted_at)` vs `week_start` for *display only*), or "No check-in" when missing. The on-time vs. late flag mirrors the trigger's decision (points row presence); only the human-readable timestamp comes from `submitted_at`.
    - Their note (or "no check-in" placeholder)
    - Scale photo thumbnail (click to open full-size in a lightbox or new tab)
    - Weight value
    - Points `<input type="number">` — pre-filled from the `points` row's `value`. On-time check-ins arrive pre-filled with `5` (trigger). Late check-ins arrive pre-filled with `0` (no points row exists yet — show `0` in the input, not blank, so Save is a real choice). The "Save" button is the override path: bump a late check-in to 5 if you decide their reason was legitimate, or zero out an on-time check-in if something was off. To delete a row entirely (different from setting to 0 — leaves no record vs. records an explicit zero), a separate "✕" icon button.
    - `awarded_by` becomes `auth.uid()` on save — overrides supersede the trigger's `null` author. (`points.awarded_by` references `public.users(id)`; `auth.uid()` is valid because every authenticated user has a matching `public.users` row.)
- **Save behaviour:** call `supabase.rpc('admin_set_weekly_points', { p_user_id, p_week_start, p_value, p_reason: 'Admin override' })`. This wraps the raw `INSERT ... ON CONFLICT (user_id, week_start) WHERE category = 'weekly_checkin' DO UPDATE` in a SECURITY DEFINER function because PostgREST's `.upsert({ onConflict })` can't pass the partial-index WHERE predicate, so calling `.upsert()` directly would fail with "no unique or exclusion constraint matching the ON CONFLICT specification" (see migration 0010). The "✕" delete button calls `supabase.rpc('admin_clear_weekly_points', { p_user_id, p_week_start })` — distinct from setting value to 0 (which records an explicit zero).
- No bulk save — row-by-row matches the manual rhythm and keeps the UI dumb.
- **Scaffolded-but-not-built tabs** (render the tab header, the body is a "Coming in Phase 2 — see PLAN.md" placeholder). Listing them here so the file structure is ready:
  - Monthly Challenges (4 events × 1st/2nd/3rd × points)
  - Body Comp (paste final-scan deltas, auto-compute via `+1/125g fat, +1/50g muscle`)
  - Push-Up Challenge (June 3–26)
  - Points Steal log (token ledger + 10-pt transfers)
  - Bonus Stars (5 categories revealed at finale)
  - Midpoint Photos (September, 15 pts/person who participates)

---

## Phase 5 — Ship

### PWA

- `npm install -D vite-plugin-pwa`.
- Add to `vite.config.js`:

  ```js
  import { VitePWA } from 'vite-plugin-pwa';
  // plugins: [react(), VitePWA({
  //   registerType: 'autoUpdate',
  //   manifest: { name: 'Recomp Games', short_name: 'Recomp', theme_color: '#0b0f1a',
  //               background_color: '#0b0f1a', display: 'standalone', start_url: './',
  //               icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
  //                       { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }] }
  // })]
  ```

- Drop icons in `public/`: `icon-192.png`, `icon-512.png` (need from user — see open dependencies).
- Verify offline shell works: load app, kill network, reload — shell should render (HTML/CSS/JS cached). Data fetches will fail and that's fine; pages should show empty states rather than crash. **No runtime caching of Supabase responses in Phase 1** — would need a Workbox runtime caching rule and Phase 1 doesn't justify the complexity.

#### iOS-standalone session caveat (important for launch comms)

On iOS <17, an installed PWA has its own storage container — it cannot see the localStorage session that was set when the user signed in via Safari. The first time a participant opens the app from the home-screen icon after install, they'll boot logged-out. The URL bar isn't editable in standalone mode, so they can't re-paste their personal link the way they did originally; without an in-app paste affordance they're stuck and will think the app is broken.

Two mitigations, both already covered elsewhere in this plan:

1. **Landing page accepts the link via a text input** (see the route map row for `/`) — same `#login=…` parse path, so the second sign-in is identical to the first.
2. **Launch-comms blurb to ship with the personal link** in the group chat:
   > "Tap the link to sign in. Once you're in, hit Share → Add to Home Screen. Then open the app from the home icon — if it asks you to sign in again, just paste the same link into the box on the front page. You only have to do this once per device."

   Add to the README and to a `LAUNCH_COMMS.md` so future-you isn't reconstructing it on 31 May.

3. **Timezone note in `LAUNCH_COMMS.md`** for anyone travelling during the challenge:
   > "All week labels and 'is it Monday?' checks in the app are Brisbane time. If you're interstate or overseas during the challenge, your phone clock won't match — that's expected. The check-in window opens at Brisbane Monday midnight regardless of where you are."

   Six months covers school holidays and Christmas; at least one of the 8 will be in a different timezone at some point. Cheaper to set the expectation in advance than to debug "the app says I missed Monday but it's Sunday here."

In 2026 most participants are likely on iOS 17+ where this is fixed and the same Safari session is visible to the PWA, but in an 8-person group one or two on older devices is plausible — and "the app is broken" texts at 7am Monday are exactly what launch day shouldn't have.

### Deploy

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: recomp.games
```

GitHub repo secrets to set: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. (Service role key is never in the build — only used by `scripts/seed_users.mjs` locally.)

### Seed remaining 6 participants

Once you have names + emails + (optionally) Messenger DP files, append to `USERS` array in `scripts/seed_users.mjs` and re-run. Existing users' passwords rotate (links re-issued); new users get fresh links.

### Pre-launch data reset

**Run this on the morning of 31 May 2026, after the final dress rehearsal.** Whatever's in the database at 00:00 Brisbane on 1 June is what 8 people see when they tap in — any stray test rows from Phase 2/3 development will show up on the live leaderboard and Activity feed and erode trust on day 1.

`scripts/reset_challenge_data.mjs`:

- Uses `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (same pattern as `seed_users.mjs`).
- **Post-launch refuse:** if `currentWeekStart() >= CHALLENGE_START_YMD` and `--force-post-launch` is not passed, bail with a loud red error before doing *anything* else (including reading the CONFIRM prompt). The CONFIRM prompt becomes muscle-memory once you've run this during a dress rehearsal — the date guard is the actual safety net against a fat-finger reset post-1-June.
- Prompts `Type CONFIRM to wipe all challenge data (users + avatars are kept):` and exits on anything else. Hard guard — accidentally running this post-launch would destroy real participant data (and the date guard above is the primary defence).
- Executes, in order:
  ```sql
  delete from public.reactions;
  delete from public.points;
  delete from public.check_ins;
  delete from public.final_photos;
  delete from public.initial_photos;
  ```
  (Reactions first because of FK cascades from `check_ins`; `points` independently. `users` and the `avatars` bucket are left untouched — participants stay seeded, avatars stay uploaded.)
- Also deletes objects from the `photos` bucket under any `<uid>/checkin/` and `<uid>/initial/` and `<uid>/final/` prefixes (otherwise the DB rows are gone but the storage objects linger and bloat the bucket).
- Idempotent — safe to re-run if you do another dress rehearsal between reset and launch.
- Prints a one-line summary per table (`reactions: 0 rows`, etc.) so you can eyeball that it actually emptied.

Doubles as an RLS sanity check: the script must succeed with the service role, and a non-admin user must not be able to run the same deletes (test via a participant's session — should hit RLS).

### Smoke test checklist (on a real phone with a real personal link)

1. **Pre-launch (any day before 2026-06-01):** Open link → silent sign-in → land on `/app` → ComingSoon view renders. `/app/initial-photos` is also gated — visit it and confirm ComingSoon shows (initial photos open on 1 June with everything else).
2. **On Monday 2026-06-01 onward:** Open link → silent sign-in → land on `/app` → normal Home renders, "Week 1 of 26".
3. Tap "Add your starting photos →" → upload all 3 → banner disappears.
4. **On a Monday:** check-in card shows pending Monday variant → tap Submit → complete the wizard → confirmation reads "Locked in! +5 pts" → Home shows green confirmed card.
5. **On any non-Monday with no check-in yet for this week:** check-in card shows the pending late variant with "Submit Late Check-In" CTA → complete the wizard → confirmation reads "Locked in · late check-in" with the "no points this week" line → Home shows the neutral confirmed-late card. Verify in Supabase: a `check_ins` row exists for this week, and `points` has *no* `weekly_checkin` row for it.
6. Open `/activity` → see own on-time check-in cleanly, late check-in tagged "Late · 0 pts". React with 🔥 on both.
7. Open `/leaderboard` → on-time participant shows 5 points, late participant shows 0 (auto-awarded by the trigger; no admin action required).
8. As Jeremy, open `/admin` → on-time rows show the auto-awarded 5, late rows show 0 with a "Late · Nd" status badge → override one late row to 5 (legitimate-reason case) → reload leaderboard → that participant's total reflects the override.
9. Tap a participant in leaderboard → land on their profile, no back button, activity grid renders.
10. Install to home screen on iOS → open from icon → shell loads with no network (data queries will show empty states; that's expected).

---

## What's deliberately NOT in this plan

- **Final body photos flow** — schema table exists (`final_photos`); UI deferred to a late-November mini-phase.
- **Avatar/display name editing** — admin handles avatars at seed; names are immutable per participant.
- **Push notifications, iOS install banner, weight-trend chart on leaderboard, comments** — all Phase 2 per `STATUS.md`, untouched here.
- **The "Not Signed In" design screen** — replaced by `<RequireAuth>` redirecting to `/`.
- **Activity feed Options A and B, Leaderboard Podium variant** — reference only; don't build.
- **Reaction picker beyond 3 fixed emojis** — schema check constraint enforces; no settings.
- **Admin UIs for the 6 non-weekly scoring categories** — schema accepts them all (migration 0008); UIs ship in later phases. In Phase 1, those points categories simply don't exist in any row yet, so the leaderboard reflects weekly check-ins only. See the Admin "Scaffolded-but-not-built tabs" list for exact scope.
- **Backfilling check-ins from previous weeks** — once `currentWeekStart()` advances on the next Monday, the previous week's window is closed. There's no UI to insert a `check_ins` row with a stale `week_start`. If you (Jeremy) ever need to backfill (e.g., someone PMs you a Sunday-night photo that didn't get submitted in time), do it via the Supabase SQL editor — it's an 8-person group, not a public app.
- **Client-side error logging / telemetry** — no Sentry, Logflare, or equivalent in Phase 1. Support model for 8 friends is "ping Jeremy in the group chat if it breaks"; Jeremy reproduces from the description, reads Supabase logs for backend errors, and Chrome DevTools / Safari Web Inspector for client errors via screen-share if needed. Worth revisiting if Phase 2 grows the participant count or the group's tolerance for "weird, refresh and try again" runs out.

---

## Open dependencies on the user

| # | Item | Blocks |
|---|---|---|
| A | The remaining 6 participants' display names + emails | Phase 5 seeding |
| B | 8 avatar JPEGs in `./avatars/` folder, named `<email-local-part>.jpg` | Phase 0 seed re-run |
| C | PWA icons: `icon-192.png` and `icon-512.png` with the ★ logo. Can stub with placeholders for now and swap later. | Phase 5 PWA setup |
| D | Confirm challenge start date is **Monday 2026-06-01** (assumed throughout) | Phase 0 `lib/dates.js` constant |

---

## Suggested execution order

Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5. Phases 1–4 are mostly independent within themselves but each depends on Phase 0 being done. If parallelizing with multiple agents, split by phase, not by file within a phase (too much shared UI state).

End of plan.
