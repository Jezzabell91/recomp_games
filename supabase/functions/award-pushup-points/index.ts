// Supabase Edge Function: daily push-up points checker.
//
// Deno port of scripts/award_pushups.mjs. For each day in a short window
// (today + yesterday), it fetches every participant's count, awards 1 idempotent
// `push_up_daily` point when they meet that day's target (rest days auto-award),
// then upserts the Activity-feed recap. Source data comes from the
// pushup_targets / pushup_activity tables (migration 0014).
//
// Why a 2-day window? The upstream API returns a per-day history (newest first),
// e.g. {"steps":[72,100],"date":["2026-06-04","2026-06-03"]}, where past days
// hold their FINAL count. Re-processing yesterday each run backfills anyone who
// crossed the line after the last pre-midnight run, or on a day the scheduler
// missed entirely — all idempotently. Today is still processed live so points
// and the recap appear same-day.
//
// Why this exists alongside the GitHub Action: pg_cron (migration 0015) fires
// this on time, every time. Run ONE scheduler, not both (both is harmless —
// idempotency dedupes — just wasteful).
//
// Deno has a global fetch + WebSocket, so the Node-20 realtime crash can't
// happen here. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACTIVITY_URL = (id: string, dateYMD: string) =>
  `https://www.thepushupchallenge.com.au/customcode/getFitnessSteps/${id}/0/${dateYMD}`;

// 'YYYY-MM-DD' for a Date in Brisbane (UTC+10, no DST). en-CA renders ISO order.
function brisbaneYMD(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Match the entry for `dateYMD` in the parallel steps/date arrays. The API
// returns a newest-first series, so never trust array position — and a past day
// now carries its final count, which is exactly what backfill needs.
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
  return 0; // that day isn't in the series (yet) → no count
}

type Roster = Array<{ activity_id: string; user: any }>;

async function processDay(admin: any, roster: Roster, day: string) {
  const notes: string[] = [];

  const { data: targetRow } = await admin
    .from("pushup_targets")
    .select("target")
    .eq("event_date", day)
    .maybeSingle();
  if (!targetRow) return { date: day, skipped: "no target" };

  const target: number = targetRow.target;
  const restDay = target === 0;
  const liveCount = new Map<string, number>();
  let awarded = 0, already = 0, pending = 0;

  for (const { activity_id, user } of roster) {
    let count: number;
    try {
      count = await fetchCountForDate(activity_id, day);
    } catch (e) {
      notes.push(`${user.display_name}: fetch failed (${(e as Error).message})`);
      continue;
    }
    liveCount.set(user.id, count);

    if (!(restDay || count >= target)) {
      pending++;
      continue;
    }

    const { error: insErr } = await admin.from("points").insert({
      user_id: user.id,
      week_start: day,
      value: 1,
      category: "push_up_daily",
      reason: restDay
        ? `Push-up rest day (${day})`
        : `Push-up target met (${count}/${target}) on ${day}`,
      awarded_by: null,
    });
    if (!insErr) awarded++;
    else if ((insErr as any).code === "23505") already++;
    else notes.push(`${user.display_name}: insert failed — ${insErr.message}`);
  }

  // Recap, built from the points table (source of truth for who's earned it).
  const { data: earned } = await admin
    .from("points")
    .select("user_id")
    .eq("category", "push_up_daily")
    .eq("week_start", day);

  const byId = new Map(roster.map(({ user }) => [user.id, user]));
  const completed = (earned ?? [])
    .map(({ user_id }) => {
      const u = byId.get(user_id);
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
        event_date: day,
        payload: { target, rest_day: restDay, points_each: 1, completed },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "kind,event_date" },
    );
  }

  return { date: day, target, awarded, already, pending, completed: completed.length, notes };
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Load the roster once (activity id + profile fields for the recap).
  const { data: rosterRows, error: rosterErr } = await admin
    .from("pushup_activity")
    .select("activity_id, users:user_id (id, display_name, color, avatar_url)");
  if (rosterErr) {
    return Response.json({ ok: false, error: rosterErr.message }, { status: 500 });
  }
  const roster: Roster = (rosterRows ?? [])
    .map((r: any) => ({ activity_id: r.activity_id, user: r.users }))
    .filter((r: any) => r.user);

  // Today live + yesterday backfill (yesterday's count is now final upstream).
  const now = new Date();
  const today = brisbaneYMD(now);
  const yesterday = brisbaneYMD(new Date(now.getTime() - 86_400_000));

  const days = [];
  for (const day of [today, yesterday]) {
    days.push(await processDay(admin, roster, day));
  }

  return Response.json({ ok: true, days });
});
