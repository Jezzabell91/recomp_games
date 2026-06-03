// Daily push-up points checker.
//
// What it does (one run):
//   1. Work out today's Brisbane date.
//   2. Look up today's target in pushup_targets.csv. No row → challenge isn't
//      running today (e.g. after June), so do nothing and exit 0.
//   3. For each participant in team_fitness_activity_ids.csv, fetch their live
//      push-up count from the Push-Up Challenge API.
//   4. If they've met the target (count >= target; rest days where target == 0
//      are auto-awarded), insert a 1-point `push_up_daily` row.
//
// Idempotent by design (migration 0012 adds a partial unique index): this is
// meant to run every 30 min through the afternoon, awarding the point the first
// time someone crosses the target. Later runs that day are harmless no-ops.
//
// IMPORTANT — the API only reports the CURRENT Brisbane day's running count and
// resets at midnight; it has no history and ignores the date in the URL. So the
// schedule MUST capture the day before midnight Brisbane. The morning after is
// too late — yesterday's number is gone.
//
// Credentials (works both locally and in CI):
//   • CI: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY come from env (secrets).
//   • Local: same keys are read from .env.local (process.env wins if both set).
//
// Usage (local): node scripts/award_pushups.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { todayInBrisbaneYMD } from "../lib/dates.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── Env: process.env (CI secrets) takes precedence, .env.local fills gaps ──
function loadEnv() {
  const env = { ...process.env };
  const localPath = resolve(ROOT, ".env.local");
  if (existsSync(localPath)) {
    for (const line of readFileSync(localPath, "utf8").split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      if (env[key] === undefined) env[key] = line.slice(i + 1).trim();
    }
  }
  return env;
}

// Minimal CSV reader. Our files have no quoted/embedded-comma fields.
function parseCsv(relPath) {
  const lines = readFileSync(resolve(ROOT, relPath), "utf8").trim().split("\n");
  const header = lines[0].split(",").map((s) => s.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row = {};
    header.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    return row;
  });
}

// The API returns parallel `steps`/`date` arrays — a time series, not a scalar.
// We MUST match the entry whose date is the day we care about rather than trust
// array position: once the challenge has multiple days of history, steps[0] may
// be day 1, not the day we're scoring. We also force the requested date into the
// URL (the CSV's embedded date is stale) so the query is anchored on `dateYMD`.
async function fetchCountForDate(url, dateYMD) {
  const dated = url.replace(/\/\d{4}-\d{2}-\d{2}$/, `/${dateYMD}`);
  const res = await fetch(dated, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const steps = Array.isArray(json.steps) ? json.steps : [];
  const dates = Array.isArray(json.date) ? json.date : [];
  const idx = dates.indexOf(dateYMD);
  if (idx !== -1) return Number(steps[idx]) || 0; // exact date match — preferred
  if (dates.length === 0 && steps.length === 1) return Number(steps[0]) || 0; // legacy scalar shape
  return 0; // date not present in the series → no count for that day yet
}

async function main() {
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Local: add them to .env.local. CI: set them as repo secrets."
    );
    process.exit(1);
  }

  const today = todayInBrisbaneYMD();
  const targetRow = parseCsv("pushup_targets.csv").find((r) => r.Date === today);
  if (!targetRow) {
    console.log(`No push-up target for ${today} (Brisbane) — nothing to do.`);
    return;
  }
  const target = Number(targetRow.Target);
  const restDay = target === 0;
  console.log(
    `Push-up check for ${today} (Brisbane) — target ${target}` +
      (restDay ? " (rest day: auto-award all)" : "")
  );

  const participants = parseCsv("team_fitness_activity_ids.csv");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Map participant Name → user (display_name we seeded). We also carry color +
  // avatar_url so the recap row can be rendered with no joins.
  const { data: users, error: usersErr } = await admin
    .from("users")
    .select("id, display_name, color, avatar_url");
  if (usersErr) {
    console.error("Failed to load users:", usersErr.message);
    process.exit(1);
  }
  const userByName = new Map(users.map((u) => [u.display_name, u]));
  const userById = new Map(users.map((u) => [u.id, u]));

  let awarded = 0;
  let already = 0;
  let pending = 0;
  const liveCountByUserId = new Map(); // this run's fetched count, for the recap

  for (const p of participants) {
    const user = userByName.get(p.Name);
    if (!user) {
      console.warn(`- ${p.Name}: no matching user (display_name) — skipped`);
      continue;
    }
    const userId = user.id;

    let count;
    try {
      count = await fetchCountForDate(p.URL, today);
    } catch (e) {
      console.warn(`- ${p.Name}: fetch failed (${e.message}) — skipped this run`);
      continue;
    }
    liveCountByUserId.set(userId, count);

    const met = restDay || count >= target;
    if (!met) {
      pending++;
      console.log(`  ✗ ${p.Name}: ${count}/${target} — not yet`);
      continue;
    }

    const { error: insErr } = await admin.from("points").insert({
      user_id: userId,
      week_start: today, // the day this bonus is for (see migration 0012)
      value: 1,
      category: "push_up_daily",
      reason: restDay
        ? `Push-up rest day (${today})`
        : `Push-up target met (${count}/${target}) on ${today}`,
      awarded_by: null,
    });

    if (!insErr) {
      awarded++;
      console.log(`  ✓ ${p.Name}: ${restDay ? "rest day" : `${count}/${target}`} — +1`);
    } else if (insErr.code === "23505") {
      already++; // already earned today — expected on repeat runs
      console.log(`  • ${p.Name}: already awarded today`);
    } else {
      console.error(`  ! ${p.Name}: insert failed — ${insErr.message}`);
    }
  }

  console.log(
    `Done. ${awarded} newly awarded, ${already} already had it, ${pending} not yet at target.`
  );

  // ── Activity-feed recap ──────────────────────────────────────────────
  // Build it from the points table (the source of truth for who's earned the
  // day's bonus), not from this run's live fetches — so a transient API hiccup
  // can never drop someone who already qualified earlier in the day.
  const { data: earned, error: earnedErr } = await admin
    .from("points")
    .select("user_id")
    .eq("category", "push_up_daily")
    .eq("week_start", today);
  if (earnedErr) {
    console.error("Recap skipped — couldn't read today's points:", earnedErr.message);
    return;
  }

  const completed = (earned || [])
    .map(({ user_id }) => {
      const u = userById.get(user_id);
      if (!u) return null;
      const count = liveCountByUserId.get(user_id);
      return {
        user_id,
        name: u.display_name,
        color: u.color,
        avatar_url: u.avatar_url,
        count: count ?? null, // null if this run didn't fetch them
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Nothing to celebrate yet (and not a rest day) → don't post an empty card.
  if (completed.length === 0 && !restDay) {
    console.log("No recap posted yet — nobody has hit the target.");
    return;
  }

  const payload = { target, rest_day: restDay, points_each: 1, completed };
  const { error: recapErr } = await admin.from("feed_events").upsert(
    {
      kind: "push_up_daily_summary",
      event_date: today,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "kind,event_date" }
  );
  if (recapErr) console.error("Recap upsert failed:", recapErr.message);
  else console.log(`Recap updated — ${completed.length} on the board for ${today}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
