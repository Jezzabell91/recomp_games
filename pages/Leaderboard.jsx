import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import { currentWeekStart, weekNumber, totalWeeks } from '../lib/dates';
import { sortLeaderboardForViewer } from '../lib/leaderboard';

import Avatar from '../components/ui/Avatar';
import BottomNav from '../components/ui/BottomNav';

const MEDAL = [theme.medalGold, theme.medalSilver, theme.medalBronze];
const TOTAL_WEEKS = totalWeeks();

export default function Leaderboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const myUserId = session?.user?.id || null;

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const wkNum = weekNumber(currentWeekStart());

  // Per-viewer tiebreak: you float to the top of any tie group you're in.
  // Signed-out viewers fall through to the SQL view's deterministic order.
  const sortedRows = useMemo(
    () => (rows ? sortLeaderboardForViewer(rows, myUserId) : null),
    [rows, myUserId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('user_id, display_name, avatar_url, color, total_points, weeks_checked_in');
      if (cancelled) return;
      if (error) { setError(error.message); return; }
      setRows(data ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  function openProfile(userId) {
    if (!session) return; // signed-out: rows are not interactive
    if (userId === myUserId) navigate('/profile');
    else navigate(`/profile/${userId}`);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bgGrad,
      color: theme.text,
      fontFamily: theme.bd,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '60px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
          <span style={{
            fontSize: 16, color: ACCENT,
            filter: `drop-shadow(0 0 4px ${ACCENT}55)`,
          }}>★</span>
          <span style={{
            fontFamily: theme.hd, fontWeight: 500, fontSize: 12,
            color: theme.textMut, letterSpacing: 1.5, textTransform: 'uppercase',
          }}>Recomp Games 2026</span>
        </div>
        <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 26 }}>Leaderboard</div>
        <div style={{
          fontFamily: theme.hd, fontWeight: 500, fontSize: 13,
          color: theme.textSec, marginTop: 2,
        }}>Week {wkNum} of {TOTAL_WEEKS}</div>
      </div>

      <div style={{ flex: 1, padding: '0 16px' }}>
        {error && (
          <div style={{ color: '#ff6b6b', fontFamily: theme.bd, padding: '12px 0' }}>
            {error}
          </div>
        )}
        {!sortedRows && !error && (
          <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>
            Loading…
          </div>
        )}
        {sortedRows && sortedRows.length === 0 && !error && (
          <div style={{
            color: theme.textMut, padding: '40px 0', textAlign: 'center',
            fontFamily: theme.bd, fontSize: 14,
          }}>
            No participants yet.
          </div>
        )}
        {sortedRows && sortedRows.length > 0 && sortedRows.map((r, i) => {
          const isYou = !!myUserId && r.user_id === myUserId;
          // Medal colors follow the shared rank, not the array index — so
          // four people tied at rank 1 all show gold, none show silver.
          const rankColor = r.displayRank <= 3 ? MEDAL[r.displayRank - 1] : theme.textMut;
          const barColor = isYou ? ACCENT : (r.color || ACCENT);
          const pct = Math.min(100, (r.weeks_checked_in / TOTAL_WEEKS) * 100);
          const interactive = !!session;

          return (
            <button
              key={r.user_id}
              type="button"
              onClick={interactive ? () => openProfile(r.user_id) : undefined}
              disabled={!interactive}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: i < sortedRows.length - 1 ? `1px solid ${theme.sep}` : 'none',
                color: 'inherit',
                cursor: interactive ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: theme.hd, fontWeight: 700, fontSize: 15,
                color: rankColor, width: 22, textAlign: 'center', flexShrink: 0,
              }}>{r.displayRank}</span>
              <Avatar
                name={r.display_name}
                src={r.avatar_url}
                color={r.color || ACCENT}
                size={34}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: theme.hd,
                  fontWeight: isYou ? 600 : 500,
                  fontSize: 15,
                  color: isYou ? ACCENT : theme.text,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.display_name}
                  </span>
                  {isYou && (
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      background: ACCENT + '22', color: ACCENT,
                      padding: '2px 6px', borderRadius: 6,
                      fontFamily: theme.hd, letterSpacing: 0.5,
                    }}>YOU</span>
                  )}
                </div>
                <div style={{
                  marginTop: 5, height: 3, borderRadius: 2,
                  background: theme.sep,
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%', borderRadius: 2,
                    background: barColor, opacity: 0.5,
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 16 }}>
                  {r.total_points}
                </div>
                <div style={{ fontSize: 10, color: theme.textMut, fontFamily: theme.hd }}>
                  {r.weeks_checked_in}/{TOTAL_WEEKS} wks
                </div>
              </div>
            </button>
          );
        })}

        {!session && sortedRows && (
          <div style={{ padding: '24px 0 16px', textAlign: 'center' }}>
            <Link to="/" style={{
              fontFamily: theme.hd, fontWeight: 500, fontSize: 13,
              color: theme.textSec, textDecoration: 'none',
            }}>← Back to home</Link>
          </div>
        )}
      </div>

      {session && <BottomNav active="leaderboard" />}
    </div>
  );
}
