# Recomp Games — Build Status

**Challenge dates:** 1 June 2026 → 1 December 2026 (26 weeks)
**Participants:** 8 friends in Australia
**Hard ship date:** 1 June 2026

---

## Stack & key decisions

- **Frontend:** Vite + React 18, deployed to GitHub Pages at `recomp.games` (CNAME).
- **Backend:** Supabase (Postgres + Auth + Storage), Sydney region (`ap-southeast-2`).
- **Routing:** HashRouter (GitHub Pages doesn't support client-side path routing without workarounds).
- **Auth:** personal links via URL fragment — `https://recomp.games/#login=<base64(email:password)>`. Fragment is client-only so credentials never reach server logs. After first sign-in on a device, the Supabase session persists in localStorage; the link is no longer needed on that device.
- **Photo privacy:** shared within the group (all 8 participants can view each other's photos). Leaderboard is public; photos and notes are auth-gated.
- **Scoring:** admin (Jeremy) enters points manually per person per week.
- **Week cutoff:** Monday 23:59 Brisbane time (AEST, UTC+10, no DST).
- **Photo cadence:** initial body photos at start (front/side/back), final body photos at end, plus a weekly scale photo with each check-in.

---

## Completed

### Supabase setup
- [x] Project created in Sydney region, Free plan, standard Postgres (not OrioleDB).
- [x] Schema (`supabase/migrations/0001_init.sql`): `users`, `initial_photos`, `final_photos`, `check_ins`, `points`, `leaderboard` view, `is_admin()` helper.
- [x] Row Level Security policies on all tables.
- [x] Table-level grants for `anon` / `authenticated` / `service_role` (`0002_grants.sql`).
- [x] Storage bucket `photos` created (private, 50MB cap, `image/*` MIME).
- [x] Storage RLS policies (`0003_storage_policies.sql`).
- [x] Two seed users created via `scripts/seed_users.mjs`:
  - Jeremy (`jeremy.bell91@gmail.com`) — admin
  - Andrew (`andrew-bell@hotmail.com`)

### App
- [x] Dependencies: `@supabase/supabase-js`, `react-router-dom` installed.
- [x] Env config (`.env.local` for secrets, `.env.example` for template, `.gitignore` updated).
- [x] Supabase client (`lib/supabase.js`).
- [x] Personal-link auth flow (`lib/auth.js` + `context/AuthProvider.jsx`).
- [x] Routes (HashRouter): `/` (landing), `/#/app` (participant home), `/#/admin` (admin portal), `/#/leaderboard` (public).
- [x] Placeholder pages: `Home`, `Admin`, `Leaderboard` (Leaderboard fetches real data from the view).
- [x] End-to-end auth verified locally: personal link → silent sign-in → `/#/app` shows "Hey, Jeremy 👋" with admin button visible.

### Design
- [x] UI component brief generated for Claude Design (see chat history; not yet saved as a file).

---

## In progress / paused for design

- [ ] Final visual design for app screens (waiting on Claude Design).

## To do (Phase 1, before 1 June)

- [ ] **First-login flow for initial body photos** — capture/upload front/side/back, skippable, returnable.
- [ ] **Weekly check-in form** — scale photo capture (`<input capture>`), weight (kg), one-sentence note. Client-side resize to ~1280px JPEG before upload. Locks at Monday 23:59 Brisbane.
- [ ] **Admin portal** — list all participants per week, view notes + photo thumbnails + weight, enter points (free-form number) per person, save.
- [ ] **Leaderboard polish** — apply real design when available.
- [ ] **PWA shell** — `vite-plugin-pwa`, manifest, service worker, app icons, offline-cached shell. Sets us up for Phase 2 push.
- [ ] **Deploy to GitHub Pages** — GitHub Action to build + push to `gh-pages`. Verify CNAME persists. Smoke test with a real personal link on phone.
- [ ] **Seed the remaining 6 participants** once you have their info.

## Phase 2 (after launch, mid-June)

- [ ] **Push notifications**: Web Push API + Supabase Edge Function + scheduled cron (Sunday 14:00 UTC = Monday 00:00 Brisbane).
- [ ] **iOS install prompt** — Add-to-Home-Screen banner for iPhone users (required for iOS push).
- [ ] **Weight-trend chart** on participant home + leaderboard.
- [ ] **Reactions / comments** on check-ins.

## Open questions / known issues

- Need the remaining 6 participants' display names + email addresses before kickoff.
- iOS PWA push needs the app to be installed to home screen (iOS 16.4+). Worth a small how-to inside the app for iPhone users in Phase 2.
- Trust model is "anyone who sees the group chat can act as that user." Acceptable for 8 friends; documented for future reference.

---

## Next user-side actions

1. Hand the UI design brief to Claude Design.
2. Send Jeremy the remaining 6 participants' display names + emails when convenient.
