import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  currentWeekStart,
  weekNumber,
  totalWeeks,
  CHALLENGE_START_YMD,
} from '../lib/dates';
import { sortLeaderboardForViewer } from '../lib/leaderboard';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import BottomNav from '../components/ui/BottomNav';
import Avatar from '../components/ui/Avatar';
import WeightSparkline from '../components/ui/WeightSparkline';
import StatsRow from '../components/ui/StatsRow';

export default function ParticipantProfile() {
  const { userId } = useParams();
  const { session, profile } = useAuth();
  const myUserId = session?.user?.id;
  const wkNum = weekNumber(currentWeekStart());
  const totalWk = totalWeeks();

  const [leaderboard, setLeaderboard] = useState(null);
  const [checkIns, setCheckIns]       = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const lbPromise = supabase.from('leaderboard').select('*');
      const ciPromise = supabase
        .from('check_ins')
        .select('week_start, weight_kg')
        .eq('user_id', userId)
        .order('week_start', { ascending: true });

      const [lbRes, ciRes] = await Promise.all([lbPromise, ciPromise]);
      if (cancelled) return;
      setLeaderboard(!lbRes.error && lbRes.data ? lbRes.data : []);
      setCheckIns(!ciRes.error && ciRes.data ? ciRes.data : []);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Redirect to /profile when someone hits /profile/<their-own-id>.
  if (myUserId && userId === myUserId) return <Navigate to="/profile" replace />;

  // Sort with the *participant being viewed* as the "viewer" — their rank
  // reflects what they'd see on their own MyProfile, not what the visitor
  // would see. (Otherwise visiting your tied rival's profile would show
  // them ranked below you, which is a confusingly self-flattering reading
  // of their page.)
  const sortedLb = useMemo(
    () => sortLeaderboardForViewer(leaderboard || [], userId),
    [leaderboard, userId],
  );
  const participant = sortedLb.find((r) => r.user_id === userId);
  const rank = participant?.displayRank ?? 0;

  // 26 Mondays from challenge start — used by the activity grid.
  const allWeekStarts = useMemo(() => {
    const out = [];
    const [y, m, d] = CHALLENGE_START_YMD.split('-').map(Number);
    const start = Date.UTC(y, m - 1, d);
    for (let i = 0; i < totalWk; i++) {
      const dt = new Date(start + i * 7 * 86400000);
      const yy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dt.getUTCDate()).padStart(2, '0');
      out.push(`${yy}-${mm}-${dd}`);
    }
    return out;
  }, [totalWk]);

  const checkedInSet = useMemo(() => {
    const s = new Set();
    for (const ci of checkIns || []) s.add(ci.week_start);
    return s;
  }, [checkIns]);

  const sparkline = useMemo(() => {
    if (!checkIns || checkIns.length === 0) return null;
    const baseline = Number(checkIns[0].weight_kg);
    const latest = Number(checkIns[checkIns.length - 1].weight_kg);
    const recent = checkIns.slice(-8).map((r) => ({
      week:   weekNumber(r.week_start),
      weight: Number(r.weight_kg),
    }));
    return { history: recent, start: baseline, current: latest };
  }, [checkIns]);

  const loading = leaderboard === null || checkIns === null;

  return (
    <Page
      appBar={
        <AppBar
          userName={profile?.display_name}
          avatarSrc={profile?.avatar_url}
          avatarColor={profile?.color || ACCENT}
        />
      }
      // BottomNav with no tab active — this surface has no header back button
      // (per design decision #4), so the nav itself is the only escape hatch.
      bottomNav={<BottomNav active="" />}
    >
      {loading ? (
        <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : !participant ? (
        <div style={{ color: theme.textMut, padding: '40px 0', textAlign: 'center', fontFamily: theme.bd }}>
          Participant not found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
          {/* Hero */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', padding: '8px 0 4px',
          }}>
            <Avatar
              name={participant.display_name}
              src={participant.avatar_url}
              color={participant.color || ACCENT}
              size={72}
            />
            <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 24, marginTop: 12 }}>
              {participant.display_name}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
              fontFamily: theme.hd, fontWeight: 500, fontSize: 13, color: theme.textSec,
            }}>
              {rank > 0 && (
                <span style={{
                  fontWeight: 700, fontSize: 14,
                  color: rank === 1 ? theme.medalGold
                       : rank === 2 ? theme.medalSilver
                       : rank === 3 ? theme.medalBronze
                       : theme.textMut,
                }}>
                  #{rank}
                </span>
              )}
              <span>· {participant.weeks_checked_in} weeks checked in</span>
            </div>
          </div>

          <StatsRow
            points={participant.total_points}
            rank={rank}
            weeks={participant.weeks_checked_in}
            totalWk={totalWk}
            ownColor={participant.color || ACCENT}
          />

          {sparkline && (
            <WeightSparkline
              history={sparkline.history}
              start={sparkline.start}
              current={sparkline.current}
              color={participant.color || ACCENT}
            />
          )}

          {/* Activity grid — 13 cols × 2 rows = 26 weeks */}
          <div>
            <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
              Activity
            </div>
            <div style={{
              padding: 16, background: theme.surface,
              border: `1px solid ${theme.border}`, borderRadius: 14,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 5 }}>
                {allWeekStarts.map((ymd, i) => {
                  const done = checkedInSet.has(ymd);
                  const isCurrent = i + 1 === wkNum;
                  return (
                    <div
                      key={ymd}
                      title={`Wk ${i + 1}`}
                      style={{
                        aspectRatio: '1', borderRadius: 4,
                        background: done ? (participant.color || ACCENT) + '55' : 'rgba(255,255,255,0.06)',
                        border: isCurrent ? `2px solid ${ACCENT}` : '1px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isCurrent && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{
                display: 'flex', gap: 16, marginTop: 12,
                fontSize: 11, color: theme.textMut, fontFamily: theme.hd, fontWeight: 500,
              }}>
                <LegendSwatch swatch={{ background: (participant.color || ACCENT) + '55' }} label="Checked in" />
                <LegendSwatch swatch={{ background: 'rgba(255,255,255,0.06)' }} label="Missed" />
                <LegendSwatch swatch={{ border: `2px solid ${ACCENT}`, boxSizing: 'border-box' }} label="Now" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function LegendSwatch({ swatch, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, ...swatch }} />
      {label}
    </div>
  );
}
