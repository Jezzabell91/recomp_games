// Seed Supabase Auth users + matching public.users rows.
// Usage:
//   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (NEVER commit it)
//   2. Edit the USERS array below
//   3. node scripts/seed_users.mjs
//
// Output: a personal link per user. Share via group chat.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
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
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = env.SITE_URL || "https://recomp.games";

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

// ── EDIT THIS LIST ────────────────────────────────────────
const USERS = [
  { email: "jeremy.bell91@gmail.com",   display_name: "Jeremy",  is_admin: true },
  { email: "andrew-bell@hotmail.com",   display_name: "Andrew",  is_admin: false },
];
// ──────────────────────────────────────────────────────────

function makePassword() {
  // 32 url-safe chars, plenty of entropy.
  return randomBytes(24).toString("base64url");
}

function makeLoginLink(email, password) {
  const payload = Buffer.from(`${email}:${password}`, "utf8").toString("base64");
  return `${SITE_URL}/#login=${encodeURIComponent(payload)}`;
}

for (const u of USERS) {
  const password = makePassword();

  // Create or fetch auth user.
  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
    });

  let userId;
  if (createErr) {
    if (!/already.*registered|exists/i.test(createErr.message)) {
      console.error(`✗ ${u.email}:`, createErr.message);
      continue;
    }
    // User exists — rotate password so the new link works.
    const list = await admin.auth.admin.listUsers();
    const existing = list.data.users.find(x => x.email === u.email);
    if (!existing) { console.error(`✗ ${u.email}: exists but couldn't find`); continue; }
    userId = existing.id;
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (updErr) { console.error(`✗ ${u.email}:`, updErr.message); continue; }
  } else {
    userId = created.user.id;
  }

  // Upsert profile row.
  const { error: profErr } = await admin
    .from("users")
    .upsert(
      { id: userId, display_name: u.display_name, is_admin: u.is_admin },
      { onConflict: "id" }
    );
  if (profErr) { console.error(`✗ ${u.email} profile:`, profErr.message); continue; }

  console.log(`\n✓ ${u.display_name} (${u.email})${u.is_admin ? " [admin]" : ""}`);
  console.log(`  ${makeLoginLink(u.email, password)}`);
}

console.log("\nDone. Each link is one-time per device — it sets up a persistent session.");
