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
- **Scoring:** Weekly check-ins auto-award on a Brisbane day-of-submit tier — Mon 5, Tue 4, Wed 3, Thu 2, Fri 1, Sat/Sun 0 — via Postgres trigger (30-min grace at every day boundary for clock-skew). Admin (Jeremy) overrides via `admin_set_weekly_points` RPC. Other categories (monthly, body comp, push-ups, bonus stars, steals, midpoint photos) added in later phases — `points.category` column already supports them all.
- **Week cutoff:** Friday 23:59 Brisbane is the last day that earns points; Sat/Sun submissions still record but score 0. User-facing copy frames Monday as the "full credit" day.
- **Photo cadence:** initial body photos at start (front/side/back), final body photos at end, plus a weekly scale photo with each check-in.

---

## Completed

### Supabase setup
- [x] Project created in Sydney region, Free plan, standard Postgres (not OrioleDB).
- [x] Initial schema (`0001_init.sql`), grants (`0002`), storage policies (`0003`).
- [x] **Phase 0 migrations 0004–0010** — user `color` column, `reactions` table with fixed emoji set, public `avatars` bucket, `leaderboard` view with `color`, `points.category` reshape + partial unique index + auto-award trigger, `check_ins.note` non-empty constraint, `admin_set_weekly_points` / `admin_clear_weekly_points` RPCs.
- [x] **Migration 0011** — re-tier the weekly_checkin auto-award to Mon 5 / Tue 4 / Wed 3 / Thu 2 / Fri 1 / Sat–Sun 0, with a 30-min grace at every day boundary. Replaces the Monday-only logic from 0008.
- [x] **9 participants seeded** from `participants/participants.csv` with avatars uploaded to public `avatars` bucket. Legacy users (`jeremy.bell91@`, `andrew-bell@`) wiped pre-launch.

### Phase 0 — Foundation (complete)
- [x] Fredoka + DM Sans fonts (`index.html`).
- [x] Design tokens (`lib/theme.js`) — dark theme, accent, surface/border/text scales, fonts, radii, shadows. Single source of truth for visual styling.
- [x] Brisbane date helpers (`lib/dates.js`) — `currentWeekStart`, `isMondayInBrisbane`, `pointsForToday`, `todayInBrisbaneYMD`, `weekNumber`, `weekRangeLabel`, `formatYMDForDisplay`, `isBeforeChallengeStart`. All "now-dependent" helpers accept optional `now` arg for testability. Hand-coded 3-letter month/weekday names for ICU-version-independent output.
- [x] Sanity script (`scripts/sanity-dates.mjs`) — assertions covering Mon/Tue rollover, Sun/Mon rollover, pre-launch clamping, day-of-week point tiers, month abbreviations. All pass.
- [x] Routing guards (`components/RequireAuth.jsx`, `RequireAdmin.jsx`, `RequireChallengeStarted.jsx`) + `ComingSoon.jsx` view.
- [x] Full route map in `main.jsx` per PLAN.md: `/`, `/app`, `/app/checkin`, `/app/initial-photos`, `/activity`, `/leaderboard`, `/profile`, `/profile/:userId`, `/admin` — with appropriate guards per route.
- [x] Stub pages for unbuilt routes (`pages/CheckIn`, `InitialPhotos`, `Activity`, `MyProfile`, `ParticipantProfile`) + shared `Stub` component.
- [x] `scripts/seed_users.mjs` rewritten — reads `participants/participants.csv`, applies in-script `COLOR_BY_NAME` map, uploads avatars to public bucket with cache-buster.
- [x] `AuthProvider.jsx` hardened — `.maybeSingle()` + auto-sign-out on orphan sessions (so wipe/reseed scenarios don't leave the app stuck).

### Design
- [x] UI design handoff received in `design_handoff_recomp_games/` (reference HTML/JSX prototypes, design tokens, key decisions). Not import-ready code — Phase 1 ports to proper React in `components/ui/`.

---

### Phase 1 — Shared UI kit (complete)
- [x] `components/ui/` primitives ported from design handoff: Avatar, Button, Card, Banner, StepDots, AppBar, BottomNav, WeightSparkline, Page, ReactionPills, WeightBadge.

### Phase 2 — Core participant flows (complete)
- [x] `lib/upload.js` (resize + upload helper).
- [x] `InitialPhotos` (3-step wizard, front/side/back).
- [x] `CheckIn` (2-step wizard + re-read confirmation reading joined points row).
- [x] `Home` (full rewrite with check-in card; six modes covering full / partial / zero credit, on-time pending, partial-pending, weekend-pending).
- [x] Admin bypass for the pre-challenge gate (commit `3853db5`).

### Phase 3 — Social (complete)
- [x] Activity feed (timeline option C, day grouping by Brisbane calendar date).
- [x] MyProfile + ParticipantProfile (no edit pencil; 26-cell activity grid on profile).
- [x] Reactions (🔥💪👏, optimistic update, schema-enforced 3-emoji set).

### Phase 4 — Leaderboard + Admin (complete)
- [x] Leaderboard rewrite (clean option A, per-user color progress bars).
- [x] Admin weekly-check-in tab calling `admin_set_weekly_points` / `admin_clear_weekly_points` RPCs.

### Phase 5 — Ship (in progress — only smoke test left)
- [x] **GitHub Actions deploy workflow** — `.github/workflows/deploy.yml` deploys `main` → `recomp.games` via official `actions/deploy-pages@v4` flow. Concurrency-guarded, supports `workflow_dispatch`. Site is live.
- [x] **PWA setup** — `vite-plugin-pwa` configured in `vite.config.js` (autoUpdate SW, manifest with `start_url`/`scope` = `./`, both icons marked `purpose: "any maskable"`). `scripts/gen_icons.mjs` generates the two PNGs (`public/icon-192.png`, `public/icon-512.png`) — gold ★ on `#0b0f1a` inside the 80% maskable safe zone. `index.html` has `apple-touch-icon` + `apple-mobile-web-app-*` meta for iOS install. Build precaches 6 entries (~485 KiB); no runtime caching of Supabase responses.
- [x] **Pre-launch data reset script** — `scripts/reset_challenge_data.mjs`. Two safety layers: red-error date guard against running on/after `CHALLENGE_START_YMD` (unless `--force-post-launch`), and a `CONFIRM` stdin prompt. Wipes reactions → points → check_ins → final_photos → initial_photos, then recursively cleans `<uid>/{initial,checkin,final}` in the `photos` bucket. Users + the `avatars` bucket are left untouched. Idempotent.
- [x] **`LAUNCH_COMMS.md`** — timeline, the launch + day-1 messages (with iOS A2HS + re-paste-link + Brisbane TZ blurbs folded in), troubleshooting cheat sheet, mid-challenge admin override notes.
- [ ] **Smoke test on a real phone** with a real personal link — 11-step checklist in `PLAN.md` (Phase 5 → Smoke test). Pre-launch ComingSoon, on-time Monday check-in, late check-in, Activity tagging, Leaderboard, Admin override, iOS A2HS install. Hands-on; can't be automated.

## Post-launch — Phase 6+ (mid-June onward)
- [ ] **Push notifications:** Web Push API + Supabase Edge Function + cron (Sunday 14:00 UTC = Monday 00:00 Brisbane).
- [ ] **iOS install prompt** — Add-to-Home-Screen banner for iPhone users.
- [ ] **Weight-trend chart** on participant home + leaderboard.
- [ ] **Comments on check-ins** (reactions ship in Phase 1).
- [ ] **Admin sub-pages for the other 6 scoring categories** — monthly challenges, body comp, push-up, bonus stars, points steals, midpoint photos. Schema already supports them via `points.category` (migration 0008).
- [ ] **Final body photos UI** — `final_photos` table exists; UI deferred to a late-November mini-phase.

## Open questions / known issues

- iOS PWA push needs the app to be installed to home screen (iOS 16.4+). `LAUNCH_COMMS.md` covers the A2HS how-to + the iOS <17 re-paste-link quirk.
- Trust model is "anyone who sees the group chat can act as that user." Acceptable for 9 friends; documented for future reference.
- End date listed as 1 December but 26 weeks from Mon 1 June ends Sun 29 November. Cosmetic only — code uses `CHALLENGE_START_YMD` + `totalWeeks() = 26`. Decide canonical end date when convenient.

---

## Next user-side actions (launch playbook)

The full playbook is in `LAUNCH_COMMS.md`. Sequence:

1. **Dress rehearsal** (any time before Sun 31 May): install the app on your phone, run through initial photos + a check-in as yourself, verify Activity / Leaderboard / Admin behave.
2. **Sun 31 May morning:** `node scripts/reset_challenge_data.mjs` → type `CONFIRM` to wipe rehearsal data. Date guard refuses to run on/after 1 June without `--force-post-launch`.
3. **Sun 31 May afternoon:** `node scripts/seed_users.mjs` → capture the 9 personal links it prints. Don't commit them. DM each friend their own link.
4. **Sun 31 May evening:** send the **Launch message** from `LAUNCH_COMMS.md` to the group chat (iOS + Android install steps, Brisbane TZ note, day-1 task list).
5. **Mon 1 June morning:** send the **Day 1 reminder**. Watch for "the app is broken" messages — `LAUNCH_COMMS.md` has a troubleshooting cheat sheet for the seven most likely causes.
6. **Real-phone smoke test** (last Phase 5 item) — walk the 11-step checklist in `PLAN.md` (Phase 5 → Smoke test) against `recomp.games` on an actual phone before sending the launch message.
