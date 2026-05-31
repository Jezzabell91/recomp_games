# Launch comms — Recomp Games

Everything you'll send to the group chat around launch (Mon 1 June 2026), plus the playbook for the 24 hours either side. Future-you wrote this so present-you doesn't have to reconstruct it under time pressure.

---

## Timeline

| When (Brisbane) | What |
|---|---|
| Mon–Fri week before | Final dress rehearsal: log in as 2–3 test users, do an initial photos run + a Monday check-in flow, verify Activity/Leaderboard/Admin. |
| Sun 31 May, morning | Run `node scripts/reset_challenge_data.mjs` once. Type CONFIRM. Confirms wipe to a clean state. |
| Sun 31 May, afternoon | Run `node scripts/seed_users.mjs`. Capture the 9 personal links it prints — one per participant. **Don't commit these anywhere.** Paste them into a draft of the group-chat message (below). |
| Sun 31 May, evening | Send the **Launch message** below to the group chat. Each friend DMs only their own link from you to reduce link-leakage risk (group-chat-broadcast is also fine — trust model is "anyone in the chat can act as anyone", documented and accepted). |
| Mon 1 June, 00:00 | `<ComingSoon>` view falls away on its own. `currentWeekStart()` flips to `2026-06-01` and `/app/*` routes start rendering normally. No manual action. |
| Mon 1 June, morning | Send the **Day 1 reminder** below as a follow-up. Watch the group chat for "the app is broken" texts. |

---

## Launch message (send Sun evening)

> 🌟 **Recomp Games starts tomorrow.** 26 weeks, 9 of us, one leaderboard.
>
> Your personal sign-in link is in a DM from me — tap it on your phone to open the app and sign in. You only need it once per device.
>
> **Install it to your home screen (recommended):**
>
> - **iPhone:** open the link in Safari → sign in → tap the Share button → **Add to Home Screen** → tap the new ★ icon to open. If it asks you to sign in again from the home-screen app, paste the same link into the box on the front page. (One quirk of older iPhones — only happens once.)
> - **Android:** open the link in Chrome → sign in → tap the three-dot menu → **Install app** → tap the new icon to open.
>
> **What to do on day 1 (Mon 1 June):**
>
> 1. Open the app, take your 3 starting photos (front / side / back). You can do this any time during week 1 — they're private to the group.
> 2. Do your first weekly check-in: scale photo + weight + a one-liner. Submit before **Mon 11:59pm Brisbane** to bank the full +5 points.
>
> A few things to know:
>
> - Everything in the app runs on **Brisbane time** — week labels, day-of-week checks, everything. If you're interstate or overseas, that's expected and you don't need to do anything. The check-in window opens at Brisbane Monday midnight regardless of where you are.
> - **Check-ins are tiered by day:** Mon = +5, Tue = +4, Wed = +3, Thu = +2, Fri = +1, Sat/Sun = +0. Late submissions still appear in your history and the activity feed — they just earn fewer points the later in the week you submit.
> - Leaderboard is at **recomp.games/#/leaderboard** if you want to peek without signing in.
> - If anything looks broken, ping me here.

---

## Day 1 reminder (send Mon morning)

> 📷 **It's Monday — Recomp Games is live.** Two things to do today:
>
> 1. Take your starting photos (front / side / back) — open the app, follow the prompts.
> 2. Submit your first check-in (scale photo + weight + a sentence) before **11:59pm Brisbane** for the full +5 pts. (Tue +4, Wed +3, Thu +2, Fri +1, weekend +0 — earlier is better.)
>
> If you haven't installed the app to your home screen yet, the message from yesterday has the steps. Good luck team 💪

---

## Troubleshooting cheat sheet

For when someone says "the app is broken." Most reports are one of these:

| Symptom | Cause | Fix |
|---|---|---|
| "I opened it from the home screen and it wants me to sign in again." | iOS <17 PWA storage isolation — the installed app has its own storage, didn't inherit Safari's session. | Tell them to paste the same personal link into the "Got a personal link?" box on the front page. Works once per device, persists after that. |
| "It says I missed Monday but it's still Sunday here." | They're in a timezone behind Brisbane. | Working as designed — the check-in window opens at Brisbane Monday midnight. Repeat the Brisbane TZ note. |
| "The Submit button is greyed out." | Either weight is blank or note is blank (the DB rejects empty notes). | Tell them to enter both. |
| "I got fewer points than I expected." | Tiered award: Mon 5, Tue 4, Wed 3, Thu 2, Fri 1, Sat/Sun 0 — based on Brisbane day-of-submit. Or genuinely a bug — check `points` table in Supabase joined to their `check_ins` row. | If the value doesn't match the day they submitted (per Brisbane wall-clock), open `/admin` and override. |
| "My starting photos banner won't go away." | They've uploaded fewer than 3 starting photos. | Tell them to finish the front/side/back wizard. |
| "I can't see other people's photos." | They're signed out. | Sign in via personal link. |
| Anything else | Reproduce from their description. Backend logs in Supabase → Logs. Client logs via screen-share if it's a participant who's comfortable with that. | Fix in code, redeploy via push to main, message them when it's live. |

---

## If you need to override scoring mid-challenge

`/admin` → Weekly Check-Ins tab → pick the week → adjust the value in the points input → Save. Or `✕` to delete a points row entirely (different from setting to 0). All changes are auditable in the `points` table (`awarded_by` = your user ID, `awarded_at` = timestamp).

The other 6 scoring categories (monthly challenges, body comp, push-ups, bonus stars, points steals, midpoint photos) don't have admin UIs yet — for those, write to `public.points` directly via the Supabase SQL editor. The `points.category` column already accepts all of them (see migration 0008).

---

## Don't lose

- `participants/participants.csv` — the canonical 9.
- `.env.local` (gitignored) — the only place `SUPABASE_SERVICE_ROLE_KEY` lives outside Supabase itself.
- The personal links you sent each friend — they're in DMs in your group chat. If a friend loses their link and you don't have the old one cached anywhere, re-run `scripts/seed_users.mjs` for just that user (or all of them — it rotates everyone's password and re-issues links).
