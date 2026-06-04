// Supabase Edge Function: daily push-up points checker.
//
// Deno port of scripts/award_pushups.mjs. Same logic — fetch each participant's
// live count, award 1 idempotent `push_up_daily` point when they meet the day's
// target (rest days auto-award), then upsert the Activity-feed recap. Reads its
// source data from the pushup_targets / pushup_activity tables (migration 0014)
// since an Edge Function has no repo filesystem.
//
// Why this exists alongside the GitHub Action: pg_cron (migration 0015) fires
// this on time, every time — unlike GitHub's best-effort scheduler. Run ONE of
// the two, not both (running both just double-no-ops thanks to idempotency).
//
// Deno has a global fetch + WebSocket, so the Node-20 realtime crash can't
// happen here. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACTIVITY_URL = (id: string, dateYMD: string) =>
  `https://www.thepushupchallenge.com.au/customcode/getFitnessSteps/${id}/0/${dateYMD}`;

// 'YYYY-MM-DD' for "now" in Brisbane (UTC+10, no DST). en-CA renders ISO order.
function todayInBrisbaneYMD(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Match the entry for `dateYMD` in the parallel steps/date arrays (a time
// series, not a scalar — never trust array position).
async function fetchCountForDate(id: string, dateYMD: string): Promise<number> {
  const res = await fetch(ACTIVITY_URL(id, dateYMD), {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const steps: number[] = Array.isArray(json.steps) ? json.steps : [];
  const dates: string[] = Array.isArray(json.date) ? json.date : [];
  const idx = dates.indexOf(dateYMD);
  if (idx !== -1) return Number(steps[idx]) || 0;
  if (dates.length === 0 && steps.length === 1) return Number(steps[0]) || 0;
  return 0;
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const today = todayInBrisbaneYMD();
  const log: string[] = [];

  const { data: targetRow } = await admin
    .from("pushup_targets")
    .select("target")
    .eq("event_date", today)
    .maybeSingle();

  if (!targetRow) {
    const msg = `No push-up target for ${today} (Brisbane) — nothing to do.`;
    return Response.json({ ok: true, date: today, message: msg });
  }
  const target: number = targetRow.target;
  const restDay = target === 0;

  // Participants joined to their activity id + profile fields for the recap.
  const { data: roster, error: rosterErr } = await admin
    .from("pushup_activity")
    .select("activity_id, users:user_id (id, display_name, color, avatar_url)");
  if (rosterErr) {
    return Response.json({ ok: false, error: rosterErr.message }, { status: 500 });
  }

  const userById = new Map<string, any>();
  const liveCount = new Map<string, number>();
  let awarded = 0, already = 0, pending = 0;

  for (const row of roster ?? []) {
    const u = (row as any).users;
    if (!u) continue;
    userById.set(u.id, u);

    let count: number;
    try {
      count = await fetchCountForDate((row as any).activity_id, today);
    } catch (e) {
      log.push(`${u.display_name}: fetch failed (${(e as Error).message})`);
      continue;
    }
    liveCount.set(u.id, count);

    if (!(restDay || count >= target)) {
      pending++;
      continue;
    }

    const { error: insErr } = await admin.from("points").insert({
      user_id: u.id,
      week_start: today,
      value: 1,
      category: "push_up_daily",
      reason: restDay
        ? `Push-up rest day (${today})`
        : `Push-up target met (${count}/${target}) on ${today}`,
      awarded_by: null,
    });
    if (!insErr) awarded++;
    else if ((insErr as any).code === "23505") already++;
    else log.push(`${u.display_name}: insert failed — ${insErr.message}`);
  }

  // ── Recap, built from the points table (source of truth) ──────────────
  const { data: earned } = await admin
    .from("points")
    .select("user_id")
    .eq("category", "push_up_daily")
    .eq("week_start", today);

  const completed = (earned ?? [])
    .map(({ user_id }) => {
      const u = userById.get(user_id);
      if (!u) return null;
      return {
        user_id,
        name: u.display_name,
        color: u.color,
        avatar_url: u.avatar_url,
        count: liveCount.get(user_id) ?? null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  if (completed.length > 0 || restDay) {
    await admin.from("feed_events").upsert(
      {
        kind: "push_up_daily_summary",
        event_date: today,
        payload: { target, rest_day: restDay, points_each: 1, completed },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind,event_date" },
    );
  }

  return Response.json({
    ok: true,
    date: today,
    target,
    awarded,
    already,
    pending,
    completed: completed.length,
    notes: log,
  });
});
