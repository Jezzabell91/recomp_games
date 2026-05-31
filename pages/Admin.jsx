import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  CHALLENGE_START_YMD,
  currentWeekStart,
  weekNumber,
  weekRangeLabel,
  totalWeeks,
} from '../lib/dates';

import Avatar from '../components/ui/Avatar';
import Lightbox from '../components/ui/Lightbox';

const TABS = [
  { id: 'weekly_checkin',    label: 'Weekly Check-Ins', live: true  },
  { id: 'monthly_challenge', label: 'Monthly',          live: false },
  { id: 'body_comp',         label: 'Body Comp',        live: false },
  { id: 'push_up',           label: 'Push-Ups',         live: false },
  { id: 'points_steal',      label: 'Steals',           live: false },
  { id: 'bonus_star',        label: 'Bonus Stars',      live: false },
  { id: 'midpoint_photos',   label: 'Midpoint',         live: false },
];

const TOTAL_WEEKS = totalWeeks();

// Pre-compute the 26 Monday week_starts from CHALLENGE_START_YMD.
const ALL_WEEK_STARTS = (() => {
  const [y, m, d] = CHALLENGE_START_YMD.split('-').map(Number);
  const startUTC = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const dt = new Date(startUTC + i * 7 * 86400000);
    const ys = dt.getUTCFullYear();
    const ms = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const ds = String(dt.getUTCDate()).padStart(2, '0');
    out.push(`${ys}-${ms}-${ds}`);
  }
  return out;
})();

export default function Admin() {
  const [tab, setTab] = useState('weekly_checkin');

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bgGrad,
      color: theme.text,
      fontFamily: theme.bd,
    }}>
      <header style={{
        padding: '40px 18px 12px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: theme.hd, fontWeight: 500, fontSize: 11,
            color: theme.textMut, letterSpacing: 1.5, textTransform: 'uppercase',
          }}>Recomp Games · Admin</div>
          <h1 style={{
            fontFamily: theme.hd, fontWeight: 700, fontSize: 24,
            margin: '2px 0 0',
          }}>Scoring console</h1>
        </div>
        <Link to="/app" style={{
          fontFamily: theme.hd, fontWeight: 500, fontSize: 13,
          color: theme.textSec, textDecoration: 'none',
        }}>← Back to app</Link>
      </header>

      <nav style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        padding: '4px 16px 12px',
        borderBottom: `1px solid ${theme.sep}`,
      }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={t.live ? () => setTab(t.id) : undefined}
              disabled={!t.live}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 12px',
                background: active ? theme.accentDim : 'transparent',
                color: active ? ACCENT : (t.live ? theme.text : theme.textMut),
                border: `1px solid ${active ? theme.accentBorder : theme.border}`,
                borderRadius: theme.radChip,
                fontFamily: theme.hd, fontWeight: 600, fontSize: 12,
                whiteSpace: 'nowrap',
                cursor: t.live ? 'pointer' : 'not-allowed',
                opacity: t.live ? 1 : 0.55,
              }}
            >
              {t.label}
              {!t.live && (
                <span style={{
                  fontSize: 9, fontWeight: 500,
                  background: theme.surfaceBright,
                  color: theme.textMut,
                  padding: '1px 5px', borderRadius: 4,
                  letterSpacing: 0.5,
                }}>SOON</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px' }}>
        {tab === 'weekly_checkin' ? (
          <WeeklyCheckInsTab />
        ) : (
          <div style={{ color: theme.textSec, padding: '40px 0', textAlign: 'center' }}>
            Coming in a later phase — see PLAN.md.
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyCheckInsTab() {
  const { session } = useAuth();
  const adminUserId = session?.user?.id || null;

  const [weekStart, setWeekStart] = useState(() => {
    // Default to the current week if it's part of the challenge; otherwise the
    // first challenge week (so pre-launch the selector lands somewhere sensible).
    const cur = currentWeekStart();
    return ALL_WEEK_STARTS.includes(cur) ? cur : ALL_WEEK_STARTS[0];
  });

  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [rows, setRows]           = useState([]);          // joined participant rows
  const [photoUrls, setPhotoUrls] = useState({});          // path -> signed url
  const [inputs, setInputs]       = useState({});          // user_id -> string
  const [busyUser, setBusyUser]   = useState(null);
  const [savedToast, setSavedToast] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const wkIdx  = ALL_WEEK_STARTS.indexOf(weekStart);
  const wkNum  = weekNumber(weekStart);
  const wkRange = weekRangeLabel(weekStart);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, checkInsRes, pointsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, display_name, avatar_url, color')
          .order('display_name', { ascending: true }),
        supabase
          .from('check_ins')
          .select('id, user_id, week_start, weight_kg, note, submitted_at, scale_photo_path')
          .eq('week_start', weekStart),
        supabase
          .from('points')
          .select('user_id, value, reason, awarded_by, awarded_at')
          .eq('category', 'weekly_checkin')
          .eq('week_start', weekStart),
      ]);

      if (usersRes.error)    throw usersRes.error;
      if (checkInsRes.error) throw checkInsRes.error;
      if (pointsRes.error)   throw pointsRes.error;

      const checkInByUser = Object.fromEntries(
        (checkInsRes.data || []).map((r) => [r.user_id, r]),
      );
      const pointsByUser = Object.fromEntries(
        (pointsRes.data || []).map((p) => [p.user_id, p]),
      );

      const joined = (usersRes.data || []).map((u) => ({
        user_id:      u.id,
        display_name: u.display_name,
        avatar_url:   u.avatar_url,
        color:        u.color || ACCENT,
        check_in:     checkInByUser[u.id] || null,
        points_row:   pointsByUser[u.id]  || null,
      }));

      const nextInputs = {};
      for (const r of joined) {
        if (r.points_row) nextInputs[r.user_id] = String(r.points_row.value);
        else if (r.check_in) nextInputs[r.user_id] = '0';
        else nextInputs[r.user_id] = '';
      }

      setRows(joined);
      setInputs(nextInputs);

      // Batch-sign all scale photos in one round trip.
      const paths = joined
        .map((r) => r.check_in?.scale_photo_path)
        .filter(Boolean);
      if (paths.length > 0) {
        const { data: signed, error: signErr } = await supabase
          .storage.from('photos')
          .createSignedUrls(paths, 60 * 60 * 24);
        if (signErr) {
          // Non-fatal — surface in console, leave thumbnails as fallback.
          console.warn('createSignedUrls failed:', signErr.message);
          setPhotoUrls({});
        } else {
          const map = {};
          for (const s of signed || []) {
            if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
          }
          setPhotoUrls(map);
        }
      } else {
        setPhotoUrls({});
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePoints(userId) {
    const raw = inputs[userId];
    const parsed = Number(raw);
    if (raw === '' || !Number.isFinite(parsed) || parsed < 0) {
      setError(`Enter a non-negative number for ${userId}`);
      return;
    }
    setBusyUser(userId);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_set_weekly_points', {
        p_user_id:    userId,
        p_week_start: weekStart,
        p_value:      parsed,
        p_reason:     'Admin override',
      });
      if (rpcErr) throw rpcErr;
      setSavedToast({ user_id: userId, kind: 'saved', at: Date.now() });
      await load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setBusyUser(null);
    }
  }

  async function clearPoints(userId) {
    if (!confirm('Delete this points row entirely? (Different from setting to 0.)')) return;
    setBusyUser(userId);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('admin_clear_weekly_points', {
        p_user_id:    userId,
        p_week_start: weekStart,
      });
      if (rpcErr) throw rpcErr;
      setSavedToast({ user_id: userId, kind: 'cleared', at: Date.now() });
      await load();
    } catch (e) {
      setError(e.message || 'Clear failed');
    } finally {
      setBusyUser(null);
    }
  }

  // Auto-dismiss the per-row toast after 2.5s.
  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2500);
    return () => clearTimeout(t);
  }, [savedToast]);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 14,
      }}>
        <button
          type="button"
          onClick={() => setWeekStart(ALL_WEEK_STARTS[Math.max(0, wkIdx - 1)])}
          disabled={wkIdx <= 0}
          style={navBtn(wkIdx <= 0)}
          aria-label="Previous week"
        >←</button>

        <select
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          style={{
            flex: 1,
            background: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radInput,
            padding: '10px 12px',
            fontFamily: theme.hd, fontWeight: 600, fontSize: 14,
            outline: 'none',
          }}
        >
          {ALL_WEEK_STARTS.map((ws) => (
            <option key={ws} value={ws}>
              Week {weekNumber(ws)} · {weekRangeLabel(ws)}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setWeekStart(ALL_WEEK_STARTS[Math.min(ALL_WEEK_STARTS.length - 1, wkIdx + 1)])}
          disabled={wkIdx >= ALL_WEEK_STARTS.length - 1}
          style={navBtn(wkIdx >= ALL_WEEK_STARTS.length - 1)}
          aria-label="Next week"
        >→</button>
      </div>

      <div style={{
        fontFamily: theme.hd, fontWeight: 500, fontSize: 12,
        color: theme.textMut, marginBottom: 10,
      }}>
        Week {wkNum} · {wkRange} · {weekStart}
      </div>

      {error && (
        <div style={{
          background: '#ff6b6b22',
          border: `1px solid #ff6b6b44`,
          color: '#ff9b9b',
          borderRadius: theme.radCard,
          padding: '10px 12px', marginBottom: 12,
          fontFamily: theme.bd, fontSize: 13,
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>
          Loading…
        </div>
      ) : (
        rows.map((r) => (
          <AdminRow
            key={r.user_id}
            row={r}
            photoUrl={r.check_in?.scale_photo_path ? photoUrls[r.check_in.scale_photo_path] : null}
            weekStart={weekStart}
            inputValue={inputs[r.user_id] ?? ''}
            onInputChange={(v) => setInputs((prev) => ({ ...prev, [r.user_id]: v }))}
            onSave={() => savePoints(r.user_id)}
            onClear={() => clearPoints(r.user_id)}
            onPhotoClick={(url) => setLightboxSrc(url)}
            busy={busyUser === r.user_id}
            toast={savedToast?.user_id === r.user_id ? savedToast.kind : null}
          />
        ))
      )}
      <Lightbox src={lightboxSrc} alt="Scale photo" onClose={() => setLightboxSrc(null)} />
    </div>
  );
}

function AdminRow({ row, photoUrl, weekStart, inputValue, onInputChange, onSave, onClear, onPhotoClick, busy, toast }) {
  const { display_name, avatar_url, color, check_in, points_row } = row;
  const status = computeStatus(check_in, points_row, weekStart);

  // Detect dirty state: input differs from the persisted value.
  const persisted = points_row ? String(points_row.value)
                   : (check_in ? '0' : '');
  const dirty = inputValue !== persisted;

  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 0',
      borderBottom: `1px solid ${theme.sep}`,
    }}>
      <Avatar name={display_name} src={avatar_url} color={color} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
          marginBottom: 4,
        }}>
          <span style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15 }}>
            {display_name}
          </span>
          <StatusBadge status={status} />
        </div>

        {check_in ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
            {photoUrl ? (
              <button
                type="button"
                onClick={() => onPhotoClick(photoUrl)}
                aria-label="View scale photo"
                style={{
                  flexShrink: 0, background: 'transparent', border: 'none',
                  padding: 0, cursor: 'zoom-in',
                }}
              >
                <img
                  src={photoUrl}
                  alt="Scale"
                  style={{
                    width: 60, height: 46, borderRadius: 8, objectFit: 'cover',
                    border: `1px solid ${theme.border}`, display: 'block',
                  }}
                />
              </button>
            ) : (
              <div style={{
                width: 60, height: 46, borderRadius: 8,
                background: theme.surfaceBright,
                border: `1px solid ${theme.border}`,
                flexShrink: 0,
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 15 }}>
                {Number(check_in.weight_kg).toFixed(1)} kg
              </div>
              <div style={{
                fontFamily: theme.bd, fontSize: 12, color: theme.textSec,
                lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {check_in.note}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            fontFamily: theme.bd, fontSize: 13, color: theme.textMut,
            fontStyle: 'italic', marginBottom: 6,
          }}>
            No check-in submitted for this week.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={busy}
            style={{
              width: 64,
              background: theme.surface,
              color: theme.text,
              border: `1px solid ${dirty ? theme.accentBorder : theme.border}`,
              borderRadius: theme.radInput,
              padding: '8px 10px',
              fontFamily: theme.hd, fontWeight: 600, fontSize: 14,
              outline: 'none',
            }}
            aria-label={`Points for ${display_name}`}
          />
          <span style={{ fontFamily: theme.hd, fontSize: 12, color: theme.textMut }}>pts</span>
          <button
            type="button"
            onClick={onSave}
            disabled={busy || !dirty}
            style={saveBtn(busy || !dirty)}
          >
            {busy ? '…' : 'Save'}
          </button>
          {points_row && (
            <button
              type="button"
              onClick={onClear}
              disabled={busy}
              style={clearBtn(busy)}
              aria-label={`Delete points row for ${display_name}`}
              title="Delete row (different from saving 0)"
            >✕</button>
          )}
          {toast && (
            <span style={{
              fontFamily: theme.hd, fontWeight: 500, fontSize: 11,
              color: theme.positive,
            }}>
              {toast === 'saved' ? 'Saved' : 'Cleared'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const palette = {
    on_time:    { bg: theme.positive + '22', border: theme.positive + '55', color: theme.positive },
    late:       { bg: theme.surfaceBright,   border: theme.border,          color: theme.textSec },
    none:       { bg: theme.surfaceBright,   border: theme.border,          color: theme.textMut },
  }[status.kind];
  return (
    <span style={{
      fontFamily: theme.hd, fontWeight: 500, fontSize: 10,
      letterSpacing: 0.8, textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: 6,
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.color,
    }}>{status.label}</span>
  );
}

// Status reflects the trigger's tiered award: 5 = on-time green, 1–4 =
// partial-credit late, 0 or no row = no-credit late. The human-readable
// suffix is for display only.
function computeStatus(check_in, points_row, weekStart) {
  if (!check_in) return { kind: 'none', label: 'No check-in' };
  if (points_row && points_row.value === 5) {
    return { kind: 'on_time', label: `Submitted ${brisbaneStamp(check_in.submitted_at)} ✓` };
  }
  const days = daysBetween(weekStart, check_in.submitted_at);
  if (points_row && points_row.value > 0) {
    return { kind: 'late', label: `Late · ${days}d · +${points_row.value} pts` };
  }
  return { kind: 'late', label: `Late · ${days}d` };
}

function brisbaneStamp(iso) {
  const dt = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(dt);
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  const day = get('weekday');
  const hour = get('hour');
  const minute = get('minute');
  const dp = get('dayPeriod').toLowerCase();
  return `${day} ${hour}:${minute}${dp}`;
}

function daysBetween(weekStartYMD, submittedIso) {
  const [y, m, d] = weekStartYMD.split('-').map(Number);
  const weekStartUTC = Date.UTC(y, m - 1, d);
  // Use Brisbane wall-clock date of submission for stable day counting.
  const subParts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(submittedIso));
  const sy = Number(subParts.find((p) => p.type === 'year').value);
  const sm = Number(subParts.find((p) => p.type === 'month').value);
  const sd = Number(subParts.find((p) => p.type === 'day').value);
  const subUTC = Date.UTC(sy, sm - 1, sd);
  return Math.max(0, Math.round((subUTC - weekStartUTC) / 86400000));
}

function navBtn(disabled) {
  return {
    width: 38, height: 38, flexShrink: 0,
    background: theme.surface,
    color: disabled ? theme.textMut : theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radButton,
    fontFamily: theme.hd, fontWeight: 700, fontSize: 16,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}

function saveBtn(disabled) {
  return {
    padding: '7px 14px',
    background: disabled ? theme.surface : ACCENT,
    color: disabled ? theme.textMut : theme.bg,
    border: `1px solid ${disabled ? theme.border : theme.accentBorder}`,
    borderRadius: theme.radButton,
    fontFamily: theme.hd, fontWeight: 600, fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };
}

function clearBtn(disabled) {
  return {
    width: 30, height: 30,
    background: 'transparent',
    color: theme.textSec,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    fontFamily: theme.hd, fontWeight: 600, fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
