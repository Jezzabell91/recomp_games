# Recomp Games — Build Status

**Challenge dates:** 1 June 2026 → 1 December 2026 (26 weeks)
**Participants:** 9 friends in Australia (see `participants/participants.csv`)
**Hard ship date:** 1 June 2026
**Build plan:** see `PLAN.md` for the full Phase 0 → 5 breakdown

---

## Stack & key decisions

- **Frontend:** Vite + React 18, deployed to GitHub Pages at `recomp.games` (CNAME).
- **Backend:** Supabase (Postgres + Auth + Storage), Sydney region (`ap-southeast-2`).
- **Routing:** HashRouter (GitHub Pages doesn't support client-side path routing without workarounds).
- **Auth:** personal links via URL fragment — `https://recomp.games/#login=<base64(email:password)>`. Fragment is client-only so credentials never reach server logs. After first sign-in on a device, the Supabase session persists in localStorage; the link is no longer needed on that device.
- **Photo privacy:** shared within the group (all 9 participants can view each other's photos). Leaderboard is public; photos and notes are auth-gated.
- **Scoring:** Monday on-time check-ins auto-award 5 pts via Postgres trigger (30-min Tue grace for clock-skew). Admin (Jeremy) overrides via `admin_set_weekly_points` RPC. Other categories (monthly, body comp, push-ups, bonus stars, steals, midpoint photos) added in later phases — `points.category` column already supports them all.
- **Week cutoff:** Monday 23:59 Brisbane (user-facing). Trigger has internal cutoff at Tue 00:30 Brisbane.
- **Photo cadence:** initial body photos at start (front/side/back), final body photos at end, plus a weekly scale photo with each check-in.

---

## Completed

### Supabase setup
- [x] Project created in Sydney region, Free plan, standard Postgres (not OrioleDB).
- [x] Initial schema (`0001_init.sql`), grants (`0002`), storage policies (`0003`).
- [x] **Phase 0 migrations 0004–0010** — user `color` column, `reactions` table with fixed emoji set, public `avatars` bucket, `leaderboard` view with `color`, `points.category` reshape + partial unique index + auto-award trigger (30-min Tue grace), `check_ins.note` non-empty constraint, `admin_set_weekly_points` / `admin_clear_weekly_points` RPCs.
- [x] **9 participants seeded** from `participants/participants.csv` with avatars uploaded to public `avatars` bucket. Legacy users (`jeremy.bell91@`, `andrew-bell@`) wiped pre-launch.

### Phase 0 — Foundation (complete)
- [x] Fredoka + DM Sans fonts (`index.html`).
- [x] Design tokens (`lib/theme.js`) — dark theme, accent, surface/border/text scales, fonts, radii, shadows. Single source of truth for visual styling.
- [x] Brisbane date helpers (`lib/dates.js`) — `currentWeekStart`, `isMondayInBrisbane`, `todayInBrisbaneYMD`, `weekNumber`, `weekRangeLabel`, `formatYMDForDisplay`, `isBeforeChallengeStart`. All "now-dependent" helpers accept optional `now` arg for testability. Hand-coded 3-letter month/weekday names for ICU-version-independent output.
- [x] Sanity script (`scripts/sanity-dates.mjs`) — 22 assertions covering Mon/Tue rollover, Sun/Mon rollover, pre-launch clamping, month abbreviations. All pass.
- [x] Routing guards (`components/RequireAuth.jsx`, `RequireAdmin.jsx`, `RequireChallengeStarted.jsx`) + `ComingSoon.jsx` view.
- [x] Full route map in `main.jsx` per PLAN.md: `/`, `/app`, `/app/checkin`, `/app/initial-photos`, `/activity`, `/leaderboard`, `/profile`, `/profile/:userId`, `/admin` — with appropriate guards per route.
- [x] Stub pages for unbuilt routes (`pages/CheckIn`, `InitialPhotos`, `Activity`, `MyProfile`, `ParticipantProfile`) + shared `Stub` component.
- [x] `scripts/seed_users.mjs` rewritten — reads `participants/participants.csv`, applies in-script `COLOR_BY_NAME` map, uploads avatars to public bucket with cache-buster.
- [x] `AuthProvider.jsx` hardened — `.maybeSingle()` + auto-sign-out on orphan sessions (so wipe/reseed scenarios don't leave the app stuck).

### Design
- [x] UI design handoff received in `design_handoff_recomp_games/` (reference HTML/JSX prototypes, design tokens, key decisions). Not import-ready code — Phase 1 ports to proper React in `components/ui/`.

---

## In progress

Nothing in progress — Phase 0 just shipped, awaiting kickoff of Phase 1.

## To do — build phases (target: live by Mon 1 June 2026)

See `PLAN.md` for full per-phase detail. Summary:

- [ ] **Phase 1 — Shared UI kit:** `components/ui/` primitives (Avatar, Button, Card, Banner, StepDots, AppBar, BottomNav, WeightSparkline, Page, ReactionPills, WeightBadge).
- [ ] **Phase 2 — Core participant flows:** `lib/upload.js` (resize + upload helper), `InitialPhotos` (3-step wizard), `CheckIn` (2-step wizard + re-read confirmation), `Home` (full rewrite with 4-mode check-in card).
- [ ] **Phase 3 — Social:** Activity feed (timeline option C), MyProfile + ParticipantProfile, reactions (🔥💪👏).
- [ ] **Phase 4 — Leaderboard + Admin:** Leaderboard rewrite (clean option A), Admin weekly-check-in tab calling `admin_set_weekly_points` RPC.
- [ ] **Phase 5 — Ship:** PWA (vite-plugin-pwa, icons), GitHub Actions deploy workflow, `LAUNCH_COMMS.md`, pre-launch data reset script with post-launch date guard, smoke test on real phones.

## Post-launch — Phase 6+ (mid-June onward)
- [ ] **Push notifications:** Web Push API + Supabase Edge Function + cron (Sunday 14:00 UTC = Monday 00:00 Brisbane).
- [ ] **iOS install prompt** — Add-to-Home-Screen banner for iPhone users.
- [ ] **Weight-trend chart** on participant home + leaderboard.
- [ ] **Comments on check-ins** (reactions ship in Phase 1).
- [ ] **Admin sub-pages for the other 6 scoring categories** — monthly challenges, body comp, push-up, bonus stars, points steals, midpoint photos. Schema already supports them via `points.category` (migration 0008).
- [ ] **Final body photos UI** — `final_photos` table exists; UI deferred to a late-November mini-phase.

## Open questions / known issues

- iOS PWA push needs the app to be installed to home screen (iOS 16.4+). Phase 5 LAUNCH_COMMS.md will cover how-to.
- Trust model is "anyone who sees the group chat can act as that user." Acceptable for 9 friends; documented for future reference.
- End date listed as 1 December but 26 weeks from Mon 1 June ends Sun 29 November. Cosmetic only — code uses `CHALLENGE_START_YMD` + `totalWeeks() = 26`. Decide canonical end date when convenient.

---

## Next user-side actions

1. Sign in via the new Jeremy personal link and confirm ComingSoon renders at `/#/app`. `/#/admin` should still work pre-launch (no gate). `/#/leaderboard` public.
2. Distribute the other 8 personal links to participants when ready (no rush — links don't expire and only become consequential after Phase 1+ ships).
