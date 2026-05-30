// Pre-launch wipe of all challenge data. Users + avatars are kept; everything
// else (reactions, points, check_ins, final_photos, initial_photos, and the
// matching objects in the `photos` storage bucket) is deleted.
//
// Usage:
//   node scripts/reset_challenge_data.mjs                 (pre-launch only)
//   node scripts/reset_challenge_data.mjs --force-post-launch   (override the date guard — destructive)
//
// Safety layers:
//   1. Date guard — refuses to run on/after CHALLENGE_START_YMD without --force-post-launch.
//      Hardcoded post-launch refuse, because the CONFIRM prompt becomes muscle-memory
//      once you've run this during dress rehearsal.
//   2. CONFIRM prompt — must type the literal word CONFIRM.
//   3. Service role key required (same .env.local pattern as seed_users.mjs).
//
// Idempotent — safe to re-run between dress rehearsals.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin, stdout, argv, exit } from "node:process";
import { CHALLENGE_START_YMD, currentWeekStart } from "../lib/dates.js";

const RED = "\x1b[1;31m";
const RESET = "\x1b[0m";

// Load .env.local manually (no dotenv dep needed) — mirrors seed_users.mjs.
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Get it from Supabase dashboard → Settings → API → service_role secret.\n" +
    "Never commit it."
  );
  exit(1);
}

// ── Date guard (runs before the CONFIRM prompt) ───────────
const force = argv.includes("--force-post-launch");
const week = currentWeekStart();
if (week >= CHALLENGE_START_YMD && !force) {
  console.error(
    `${RED}REFUSED:${RESET} the challenge has started ` +
    `(current Brisbane week = ${week}, launch = ${CHALLENGE_START_YMD}).\n` +
    `Running this script would destroy real participant data.\n` +
    `If you genuinely need to wipe post-launch, re-run with --force-post-launch.`
  );
  exit(2);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── CONFIRM prompt ────────────────────────────────────────
const rl = readline.createInterface({ input: stdin, output: stdout });
const answer = await rl.question(
  "Type CONFIRM to wipe all challenge data (users + avatars are kept): "
);
rl.close();
if (answer !== "CONFIRM") {
  console.log("Aborted.");
  exit(0);
}

// ── DB wipe ───────────────────────────────────────────────
// Order: reactions → points → check_ins → final_photos → initial_photos.
// reactions FK-cascades from check_ins anyway, but deleting it first keeps
// the script's behaviour readable and explicit.
//
// Every table has a non-null `user_id`, so `.not('user_id', 'is', null)`
// matches every row. supabase-js requires a filter on .delete() — this is
// the canonical "delete everything" idiom for service-role wipes.
const TABLES = ["reactions", "points", "check_ins", "final_photos", "initial_photos"];

for (const table of TABLES) {
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .not("user_id", "is", null);
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    exit(1);
  }
  console.log(`  ${table}: ${count} rows`);
}

// ── Storage wipe ──────────────────────────────────────────
// The `photos` bucket holds <uid>/initial/<pose>.jpg, <uid>/checkin/<week>/scale.jpg,
// and <uid>/final/<pose>.jpg. Without this, DB rows are gone but the storage
// objects linger and bloat the bucket.
//
// Supabase storage .list() is shallow (no recursive flag), so we walk:
//   root → user dirs → {initial, checkin, final} → (for checkin) week dirs → files
async function collectPhotoPaths() {
  const paths = [];
  const { data: userDirs, error } = await admin.storage
    .from("photos")
    .list("", { limit: 1000 });
  if (error) throw error;

  for (const dir of userDirs ?? []) {
    if (!dir.name) continue;
    const uid = dir.name;

    for (const subdir of ["initial", "final"]) {
      const { data: files } = await admin.storage
        .from("photos")
        .list(`${uid}/${subdir}`, { limit: 1000 });
      for (const f of files ?? []) {
        if (f.name) paths.push(`${uid}/${subdir}/${f.name}`);
      }
    }

    const { data: weeks } = await admin.storage
      .from("photos")
      .list(`${uid}/checkin`, { limit: 1000 });
    for (const week of weeks ?? []) {
      if (!week.name) continue;
      const { data: files } = await admin.storage
        .from("photos")
        .list(`${uid}/checkin/${week.name}`, { limit: 1000 });
      for (const f of files ?? []) {
        if (f.name) paths.push(`${uid}/checkin/${week.name}/${f.name}`);
      }
    }
  }
  return paths;
}

const photoPaths = await collectPhotoPaths();
if (photoPaths.length === 0) {
  console.log("  photos bucket: 0 objects");
} else {
  // Storage remove() accepts up to ~1000 paths per call — batch to be safe.
  const BATCH = 100;
  let removed = 0;
  for (let i = 0; i < photoPaths.length; i += BATCH) {
    const batch = photoPaths.slice(i, i + BATCH);
    const { error } = await admin.storage.from("photos").remove(batch);
    if (error) {
      console.error(`✗ photos bucket batch ${i}: ${error.message}`);
      exit(1);
    }
    removed += batch.length;
  }
  console.log(`  photos bucket: ${removed} objects`);
}

console.log("\nDone. Users + avatars untouched; challenge tables empty.");
