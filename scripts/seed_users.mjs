// Seed Supabase Auth users + matching public.users rows.
// Usage:
//   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (NEVER commit it)
//   2. Confirm participants/participants.csv is current (name,email,image)
//   3. node scripts/seed_users.mjs
//
// Output: a personal link per user. Share via group chat.
//
// Data flow:
//   participants/participants.csv      → identity (name, email, avatar source path)
//   COLOR_BY_NAME below                → visual styling
//   name === "Jeremy"                  → admin
//
// Re-running:
//   • Existing users have their password rotated (links re-issued)
//   • Existing users have display_name / is_admin / color overwritten
//   • Avatars re-uploaded if the local JPEG exists at the CSV's `image` path
//     (otherwise unchanged — existing avatar_url is preserved)

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

// Load .env.local manually (no dotenv dep needed)
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
const SITE_URL     = env.SITE_URL || "https://recomp.games";

if (!SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
    "Get it from Supabase dashboard → Settings → API → service_role secret.\n" +
    "Never commit it."
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Visual styling per participant ────────────────────────
// Source of truth for participant colors. Names match participants.csv exactly.
// Jeremy + Andrew preserved from design handoff; remaining 7 alphabetically
// assigned the design-palette colors, with Justin getting a new pink because
// the design only had 8 distinct colors and we have 9 participants.
const COLOR_BY_NAME = {
  Aidan:   "#4FC3F7", // light blue
  Andrew:  "#EF5350", // red
  Brenton: "#66BB6A", // green
  Davis:   "#FF7043", // orange-red
  Jason:   "#AB47BC", // purple
  Jeremy:  "#FFD700", // gold (admin)
  Jimmy:   "#26C6DA", // cyan
  Joe:     "#FFA500", // orange
  Justin:  "#EC407A", // pink (new 9th color)
};

// ── CSV parse ─────────────────────────────────────────────
// Simple CSV: trusts no quoting / commas in fields (participants.csv is hand-
// maintained and uses plain ASCII names).
function parseCsv(text) {
  const [header, ...rows] = text.trim().split("\n").map(l => l.split(","));
  const cols = header.map(h => h.trim());
  return rows.map(r => Object.fromEntries(cols.map((c, i) => [c, (r[i] ?? "").trim()])));
}

const PARTICIPANTS = parseCsv(readFileSync("participants/participants.csv", "utf8"));

// Sanity: every CSV row needs a color mapping. Catch this at startup, before
// we partially seed the DB.
const missingColor = PARTICIPANTS.filter(p => !COLOR_BY_NAME[p.name]);
if (missingColor.length > 0) {
  console.error(
    `Missing COLOR_BY_NAME entries for: ${missingColor.map(p => p.name).join(", ")}.\n` +
    `Add them to seed_users.mjs and re-run.`
  );
  process.exit(1);
}

function makePassword() {
  return randomBytes(24).toString("base64url"); // 32 url-safe chars
}

function makeLoginLink(email, password) {
  const payload = Buffer.from(`${email}:${password}`, "utf8").toString("base64");
  return `${SITE_URL}/#login=${encodeURIComponent(payload)}`;
}

async function uploadAvatarIfPresent(imagePath, userId) {
  // imagePath is the value from the CSV (e.g. "participants/aidan.jpg"),
  // resolved relative to the project root. Upload to the public `avatars`
  // bucket at <user_id>.jpg (flat layout). Cache-buster query so re-uploads
  // invalidate immediately — the Storage CDN would otherwise serve the
  // previous JPEG until its TTL expires.
  if (!imagePath) return null;
  const localPath = resolve(imagePath);
  if (!existsSync(localPath)) return null;

  const blob = readFileSync(localPath);
  const { error } = await admin.storage
    .from("avatars")
    .upload(`${userId}.jpg`, blob, { contentType: "image/jpeg", upsert: true });
  if (error) {
    console.error(`  ! avatar upload failed: ${error.message}`);
    return null;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}.jpg?v=${Date.now()}`;
}

for (const p of PARTICIPANTS) {
  if (!p.email) {
    console.log(`- ${p.name}: no email, skipping`);
    continue;
  }

  const password = makePassword();
  const isAdmin  = p.name === "Jeremy"; // Only admin in Phase 1

  // Create or fetch auth user.
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: p.email,
      password,
      email_confirm: true,
    });

  let userId;
  if (createErr) {
    if (!/already.*registered|exists/i.test(createErr.message)) {
      console.error(`✗ ${p.email}:`, createErr.message);
      continue;
    }
    // User exists — rotate password so the new link works.
    const list = await admin.auth.admin.listUsers();
    const existing = list.data.users.find(x => x.email === p.email);
    if (!existing) { console.error(`✗ ${p.email}: exists but couldn't find`); continue; }
    userId = existing.id;
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updErr) { console.error(`✗ ${p.email}:`, updErr.message); continue; }
  } else {
    userId = created.user.id;
  }

  const newAvatarUrl = await uploadAvatarIfPresent(p.image, userId);

  const profileRow = {
    id: userId,
    display_name: p.name,
    is_admin: isAdmin,
    color: COLOR_BY_NAME[p.name],
  };
  if (newAvatarUrl) profileRow.avatar_url = newAvatarUrl;

  const { error: profErr } = await admin
    .from("users")
    .upsert(profileRow, { onConflict: "id" });
  if (profErr) { console.error(`✗ ${p.email} profile:`, profErr.message); continue; }

  const avatarTag = newAvatarUrl ? " 📷" : "";
  console.log(`\n✓ ${p.name} (${p.email})${isAdmin ? " [admin]" : ""}${avatarTag}`);
  console.log(`  ${makeLoginLink(p.email, password)}`);
}

console.log("\nDone. Each link is one-time per device — it sets up a persistent session.");
