import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  currentWeekStart,
  isMondayInBrisbane,
  weekNumber,
  weekRangeLabel,
  totalWeeks,
} from '../lib/dates';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import BottomNav from '../components/ui/BottomNav';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Banner from '../components/ui/Banner';
import Avatar from '../components/ui/Avatar';
import WeightBadge from '../components/ui/WeightBadge';
import PastCheckInList from '../components/PastCheckInList';

export default function Home() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;

  const weekStart = useMemo(() => currentWeekStart(), []);
  const isMonday = useMemo(() => isMondayInBrisbane(), []);
  const wkNum = weekNumber(weekStart);
  const totalWk = totalWeeks();

  const [checkIns, setCheckIns] = useState(null); // [{ week_start, weight_kg, note, awarded_value }] | null
  const [initialCount, setInitialCount] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      // 1. Past check-ins (last 5) left-joined to points via PostgREST embed.
      // The !left tells Supabase to LEFT JOIN points, and we filter the join
      // to category='weekly_checkin' (and same week_start) inline.
      const ciPromise = supabase
        .from('check_ins')
        .select(`
          week_start, weight_kg, note,
          points!left(value, week_start, category)
        `)
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(5);

      const ipPromise = supabase
        .from('initial_photos')
        .select('pose', { count: 'exact', head: true })
        .eq('user_id', userId);

      const lbPromise = supabase.from('leaderboard').select('*');

      const [ciRes, ipRes, lbRes] = await Promise.all([ciPromise, ipPromise, lbPromise]);
      if (cancelled) return;

      if (!ciRes.error && ciRes.data) {
        // Embedded points rows aren't filtered by the join's WHERE — they're
        // a child array. Pick the matching weekly_checkin row for THIS week_start.
        const normalised = ciRes.data.map((row) => {
          const matching = (row.points || []).find(
            (p) => p.category === 'weekly_checkin' && p.week_start === row.week_start,
          );
          return {
            week_start: row.week_start,
            weight_kg: row.weight_kg,
            note: row.note,
            awarded_value: matching ? matching.value : null,
          };
        });
        setCheckIns(normalised);
      } else {
        setCheckIns([]);
      }

      if (!ipRes.error) setInitialCount(ipRes.count ?? 0);
      else setInitialCount(0);

      if (!lbRes.error && lbRes.data) setLeaderboard(lbRes.data);
      else setLeaderboard([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ── Derived state ───────────────────────────────
  const thisWeekRow = checkIns?.find((r) => r.week_start === weekStart);
  const hasCheckedInThisWeek = !!thisWeekRow;
  const awarded5 = hasCheckedInThisWeek && thisWeekRow.awarded_value != null;

  const top3 = (leaderboard || []).slice(0, 3);
  const myRow = (leaderboard || []).find((r) => r.user_id === userId);
  const myRank = (leaderboard || []).findIndex((r) => r.user_id === userId) + 1; // 0 → 0 (unknown)

  const loading = checkIns === null || initialCount === null || leaderboard === null;

  return (
    <Page
      appBar={
        <AppBar userName={profile?.display_name} avatarSrc={profile?.avatar_url} avatarColor={profile?.color || ACCENT} />
      }
      bottomNav={<BottomNav active="home" />}
    >
      <div style={{ padding: '8px 0 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Greeting name={profile?.display_name} weekNum={wkNum} totalWk={totalWk} />

        {loading ? (
          <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
        ) : (
          <>
            <CheckInCard
              hasCheckedIn={hasCheckedInThisWeek}
              awarded5={awarded5}
              thisWeekRow={thisWeekRow}
              priorRow={checkIns.find((r) => r.week_start !== weekStart) || null}
              isMonday={isMonday}
              weekStart={weekStart}
              onSubmit={() => navigate('/app/checkin')}
            />

            {initialCount < 3 && (
              <Banner
                accent="#FFA500"
                icon="📸"
                onClick={() => navigate('/app/initial-photos')}
              >
                Add your starting photos →
              </Banner>
            )}

            <MiniLeaderboard top3={top3} myRow={myRow} myRank={myRank} />

            <Section
              title="Past Check-Ins"
              right={
                profile?.is_admin ? (
                  <Link to="/admin" style={{ color: ACCENT, fontFamily: theme.hd, fontSize: 12, textDecoration: 'none' }}>
                    Admin →
                  </Link>
                ) : null
              }
            >
              <PastCheckInList items={checkIns} emptyMessage="No check-ins yet — your first one shows up here." />
            </Section>
          </>
        )}
      </div>
    </Page>
  );
}

// ── Greeting + week progress ──────────────────────
function Greeting({ name, weekNum, totalWk }) {
  const pct = Math.min(100, Math.round((weekNum / totalWk) * 100));
  return (
    <div>
      <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>
        Hey, {name || 'you'} 👋
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: theme.hd, fontWeight: 500, fontSize: 13, color: theme.textSec }}>
          Week {weekNum} of {totalWk}
        </span>
        <div style={{ flex: 1, maxWidth: 100, height: 3, background: theme.surfaceBright, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: ACCENT }} />
        </div>
      </div>
    </div>
  );
}

// ── Check-in card (4 modes) ───────────────────────
function CheckInCard({ hasCheckedIn, awarded5, thisWeekRow, priorRow, isMonday, weekStart, onSubmit }) {
  const wk = weekNumber(weekStart);
  const range = weekRangeLabel(weekStart);

  // Mode 1: green confirmed card
  if (hasCheckedIn && awarded5) {
    const delta = priorRow ? Number((Number(thisWeekRow.weight_kg) - Number(priorRow.weight_kg)).toFixed(1)) : null;
    return (
      <Card accent={theme.positive} glow>
        <ConfirmedHeader weekNum={wk} range={range} pointsLabel={`+${thisWeekRow.awarded_value} pts`} color={theme.positive} />
        <ConfirmedSummary row={thisWeekRow} delta={delta} />
        <NextOpensFootnote />
      </Card>
    );
  }

  // Mode 2: neutral confirmed-late card
  if (hasCheckedIn && !awarded5) {
    const delta = priorRow ? Number((Number(thisWeekRow.weight_kg) - Number(priorRow.weight_kg)).toFixed(1)) : null;
    return (
      <Card>
        <ConfirmedHeader weekNum={wk} range={range} pointsLabel="Late · 0 pts" color={theme.textSec} />
        <ConfirmedSummary row={thisWeekRow} delta={delta} />
        <div style={{ marginTop: 10, fontFamily: theme.bd, fontSize: 12, color: theme.textMut }}>
          Late check-in · no points this week.
        </div>
      </Card>
    );
  }

  // Mode 3: pending Monday
  if (!hasCheckedIn && isMonday) {
    return (
      <Card accent={ACCENT} glow>
        <PendingHeader icon="⏳" weekNum={wk} range={range} color={ACCENT} />
        <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15, color: theme.text, marginTop: 4 }}>
          Check-in not submitted
        </div>
        <div style={{ fontFamily: theme.bd, fontSize: 12, color: theme.textSec, marginTop: 4, marginBottom: 14 }}>
          Window closes tonight 23:59 AEST · +5 pts
        </div>
        <Button full onClick={onSubmit}>Submit Check-In</Button>
      </Card>
    );
  }

  // Mode 4: pending late
  return (
    <Card>
      <PendingHeader icon="⏰" weekNum={wk} range={range} color={theme.textSec} />
      <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15, color: theme.text, marginTop: 4 }}>
        Monday window missed
      </div>
      <div style={{ fontFamily: theme.bd, fontSize: 12, color: theme.textSec, marginTop: 4, marginBottom: 14 }}>
        You can still submit — counts in your history, no points this week.
      </div>
      <Button variant="secondary" full onClick={onSubmit}>Submit Late Check-In</Button>
    </Card>
  );
}

function ConfirmedHeader({ weekNum, range, pointsLabel, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 13, color }}>
        ✓ Week {weekNum} · {range}
      </div>
      <div
        style={{
          fontFamily: theme.hd,
          fontWeight: 600,
          fontSize: 12,
          color,
          background: color === theme.positive ? `${theme.positive}18` : theme.surfaceBright,
          border: `1px solid ${color === theme.positive ? theme.positive + '55' : theme.border}`,
          padding: '3px 8px',
          borderRadius: 8,
        }}
      >
        {pointsLabel}
      </div>
    </div>
  );
}

function ConfirmedSummary({ row, delta }) {
  return (
    <div
      style={{
        background: theme.surfaceBright,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 20 }}>
          {Number(row.weight_kg).toFixed(1)} kg
        </span>
        {delta != null && <WeightBadge change={delta} />}
      </div>
      <div
        style={{
          marginTop: 6,
          fontFamily: theme.bd,
          fontSize: 13,
          color: theme.textSec,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {row.note}
      </div>
    </div>
  );
}

function PendingHeader({ icon, weekNum, range, color }) {
  return (
    <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 13, color, marginBottom: 8 }}>
      {icon} Week {weekNum} · {range}
    </div>
  );
}

function NextOpensFootnote() {
  return (
    <div style={{ marginTop: 10, fontFamily: theme.bd, fontSize: 12, color: theme.textMut }}>
      Next check-in opens next Monday 12:00 AM AEST.
    </div>
  );
}

// ── Mini leaderboard ─────────────────────────────
function MiniLeaderboard({ top3, myRow, myRank }) {
  return (
    <Section
      title="🏆 Leaderboard"
      right={
        <Link to="/leaderboard" style={{ color: ACCENT, fontFamily: theme.hd, fontSize: 12, textDecoration: 'none' }}>
          See all →
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {top3.map((r, i) => {
          const medalColor = i === 0 ? theme.medalGold : i === 1 ? theme.medalSilver : theme.medalBronze;
          return (
            <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px' }}>
              <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 14, color: medalColor, width: 18, textAlign: 'center' }}>
                {i + 1}
              </span>
              <Avatar name={r.display_name} src={r.avatar_url} color={r.color || ACCENT} size={28} />
              <span style={{ flex: 1, fontFamily: theme.hd, fontWeight: 500, fontSize: 14 }}>
                {r.display_name}
              </span>
              <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 14 }}>
                {r.total_points}
              </span>
            </div>
          );
        })}
      </div>
      {myRow && myRank > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            background: ACCENT + '18',
            border: `1px solid ${ACCENT}55`,
            borderRadius: 10,
            fontFamily: theme.hd,
            fontWeight: 600,
            fontSize: 13,
            color: ACCENT,
            textAlign: 'center',
          }}
        >
          You're #{myRank} with {myRow.total_points} pts
        </div>
      )}
    </Section>
  );
}

// ── Reusable section header ──────────────────────
function Section({ title, right, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 17, margin: 0 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}
