import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  currentWeekStart,
  todayInBrisbaneYMD,
  weekNumber,
} from '../lib/dates';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import BottomNav from '../components/ui/BottomNav';
import Avatar from '../components/ui/Avatar';
import WeightBadge from '../components/ui/WeightBadge';
import ReactionPills from '../components/ui/ReactionPills';

const WEEKDAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_SHORT   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Activity() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const myUserId = session?.user?.id;

  const weekStart = useMemo(() => currentWeekStart(), []);
  const wkNum = weekNumber(weekStart);

  const [items, setItems]                 = useState(null); // null = loading
  const [photoUrls, setPhotoUrls]         = useState({});   // { path: signedUrl }
  const [reactionMap, setReactionMap]     = useState({});   // { check_in_id: { emoji: count } }
  const [myReactionMap, setMyReactionMap] = useState({});   // { check_in_id: Set<emoji> }

  useEffect(() => {
    if (!myUserId) return;
    let cancelled = false;

    (async () => {
      // 1. Current week's check-ins joined to user + (left) the matching weekly_checkin
      // points row. The !left embed gives us a points array; we pick the matching
      // weekly_checkin row client-side. `awarded_value === null` is the canonical
      // "late · 0 pts" signal — same derivation Home + PastCheckInList already use.
      const ciRes = await supabase
        .from('check_ins')
        .select(`
          id, user_id, week_start, weight_kg, note, submitted_at, scale_photo_path,
          users:user_id (display_name, color, avatar_url),
          points!left (value, week_start, category)
        `)
        .eq('week_start', weekStart)
        .order('submitted_at', { ascending: false });

      if (cancelled) return;
      if (ciRes.error || !ciRes.data) {
        setItems([]);
        return;
      }

      const rows = ciRes.data.map((r) => {
        const matching = (r.points || []).find(
          (p) => p.category === 'weekly_checkin' && p.week_start === r.week_start,
        );
        return {
          id:           r.id,
          user_id:      r.user_id,
          week_start:   r.week_start,
          weight_kg:    Number(r.weight_kg),
          note:         r.note,
          submitted_at: r.submitted_at,
          scale_path:   r.scale_photo_path,
          display_name: r.users?.display_name || '',
          color:        r.users?.color || ACCENT,
          avatar_url:   r.users?.avatar_url || null,
          awarded_value: matching ? matching.value : null,
        };
      });

      // 2. Most-recent prior check-in per user for the delta pill. NOT
      // "last week" literally — a skipped week would null-out the delta on the
      // following submission. One query, dedupe client-side (≤ 9×26 rows).
      const priorRes = await supabase
        .from('check_ins')
        .select('user_id, weight_kg, week_start')
        .lt('week_start', weekStart)
        .order('week_start', { ascending: false });

      const priorByUser = {};
      if (!priorRes.error && priorRes.data) {
        for (const p of priorRes.data) {
          if (!priorByUser[p.user_id]) {
            priorByUser[p.user_id] = Number(p.weight_kg);
          }
        }
      }

      const itemsWithDelta = rows.map((r) => {
        const prior = priorByUser[r.user_id];
        const change = prior != null
          ? Number((r.weight_kg - prior).toFixed(1))
          : null;
        return { ...r, change };
      });

      if (cancelled) return;
      setItems(itemsWithDelta);

      // 3. Sign all scale photos in ONE round trip. Skipping the per-row
      // createSignedUrl avoids up to 9 sequential network calls.
      const paths = itemsWithDelta.map((r) => r.scale_path).filter(Boolean);
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from('photos')
          .createSignedUrls(paths, 60 * 60 * 24);
        if (!cancelled && signed) {
          const map = {};
          for (const s of signed) {
            if (s.path && s.signedUrl) map[s.path] = s.signedUrl;
          }
          setPhotoUrls(map);
        }
      }

      // 4. Reactions for visible check-ins, one query.
      const ids = itemsWithDelta.map((r) => r.id);
      if (ids.length > 0) {
        const { data: rxs } = await supabase
          .from('reactions')
          .select('check_in_id, user_id, emoji')
          .in('check_in_id', ids);
        if (!cancelled && rxs) {
          const counts = {};
          const mine = {};
          for (const rx of rxs) {
            if (!counts[rx.check_in_id]) counts[rx.check_in_id] = {};
            counts[rx.check_in_id][rx.emoji] = (counts[rx.check_in_id][rx.emoji] || 0) + 1;
            if (rx.user_id === myUserId) {
              if (!mine[rx.check_in_id]) mine[rx.check_in_id] = new Set();
              mine[rx.check_in_id].add(rx.emoji);
            }
          }
          setReactionMap(counts);
          setMyReactionMap(mine);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [myUserId, weekStart]);

  async function toggleReaction(checkInId, emoji) {
    const alreadyReacted = myReactionMap[checkInId]?.has(emoji);

    // Optimistic update — snapshot for rollback.
    const prevReactions = reactionMap;
    const prevMine = myReactionMap;

    const nextReactions = { ...reactionMap, [checkInId]: { ...(reactionMap[checkInId] || {}) } };
    const nextMine = { ...myReactionMap };
    nextMine[checkInId] = new Set(myReactionMap[checkInId] || []);

    if (alreadyReacted) {
      nextMine[checkInId].delete(emoji);
      nextReactions[checkInId][emoji] = Math.max(0, (nextReactions[checkInId][emoji] || 1) - 1);
    } else {
      nextMine[checkInId].add(emoji);
      nextReactions[checkInId][emoji] = (nextReactions[checkInId][emoji] || 0) + 1;
    }
    setReactionMap(nextReactions);
    setMyReactionMap(nextMine);

    const { error } = alreadyReacted
      ? await supabase
          .from('reactions')
          .delete()
          .eq('check_in_id', checkInId)
          .eq('user_id', myUserId)
          .eq('emoji', emoji)
      : await supabase
          .from('reactions')
          .insert({ check_in_id: checkInId, user_id: myUserId, emoji });

    if (error) {
      // Rollback — server is the truth.
      setReactionMap(prevReactions);
      setMyReactionMap(prevMine);
    }
  }

  const groups = useMemo(() => {
    if (!items) return [];
    const todayYMD = todayInBrisbaneYMD();
    const yesterdayYMD = todayInBrisbaneYMD(new Date(Date.now() - 86400000));
    const today = [], yesterday = [], earlier = [];
    for (const it of items) {
      const ymd = todayInBrisbaneYMD(new Date(it.submitted_at));
      if (ymd === todayYMD) today.push(it);
      else if (ymd === yesterdayYMD) yesterday.push(it);
      else earlier.push(it);
    }
    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Earlier', items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [items]);

  return (
    <Page
      appBar={
        <AppBar
          userName={profile?.display_name}
          avatarSrc={profile?.avatar_url}
          avatarColor={profile?.color || ACCENT}
        />
      }
      bottomNav={<BottomNav active="activity" />}
    >
      <div style={{ padding: '4px 0 12px' }}>
        <h1 style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>
          Activity
        </h1>
        <div style={{ fontFamily: theme.hd, fontWeight: 500, fontSize: 13, color: theme.textSec }}>
          Week {wkNum} check-ins
        </div>
      </div>

      {items === null ? (
        <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{
          color: theme.textMut, padding: '40px 0', textAlign: 'center',
          fontFamily: theme.bd, fontSize: 14,
        }}>
          No check-ins this week yet.<br />Be the first 💪
        </div>
      ) : (
        <div style={{ paddingBottom: 12 }}>
          {groups.map((g) => (
            <div key={g.label}>
              <div style={{
                fontFamily: theme.hd, fontWeight: 600, fontSize: 12,
                color: theme.textMut, letterSpacing: 1.2, textTransform: 'uppercase',
                padding: '14px 0 8px',
              }}>
                {g.label}
              </div>
              {g.items.map((it, i) => (
                <FeedItem
                  key={it.id}
                  item={it}
                  isLastInGroup={i === g.items.length - 1}
                  isMe={it.user_id === myUserId}
                  photoUrl={photoUrls[it.scale_path]}
                  reactions={reactionMap[it.id] || {}}
                  myReactions={myReactionMap[it.id] || new Set()}
                  onAvatarClick={() => {
                    if (it.user_id === myUserId) navigate('/profile');
                    else navigate(`/profile/${it.user_id}`);
                  }}
                  onToggleReaction={(emoji) => toggleReaction(it.id, emoji)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}

function FeedItem({ item, isLastInGroup, isMe, photoUrl, reactions, myReactions, onAvatarClick, onToggleReaction }) {
  const late = item.awarded_value == null;
  const time = relativeTimeLabel(item.submitted_at);

  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {!isLastInGroup && (
        <div style={{
          position: 'absolute', left: 16, top: 40, width: 2, bottom: -4,
          background: theme.sep, borderRadius: 1,
        }} />
      )}
      <button
        type="button"
        onClick={onAvatarClick}
        aria-label={`Open ${item.display_name}'s profile`}
        style={{
          flexShrink: 0, position: 'relative', zIndex: 1,
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
        }}
      >
        <Avatar name={item.display_name} src={item.avatar_url} color={item.color} size={34} />
      </button>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onAvatarClick}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: theme.hd, fontWeight: 600, fontSize: 14,
              color: isMe ? ACCENT : theme.text,
            }}
          >
            {item.display_name}{isMe ? ' (you)' : ''}
          </button>
          <span style={{ fontSize: 11, color: theme.textMut, fontFamily: theme.hd, fontWeight: 500 }}>
            {time}
          </span>
          {late && (
            <span style={{
              fontFamily: theme.hd, fontWeight: 500, fontSize: 10,
              color: theme.textMut, textTransform: 'uppercase', letterSpacing: 1,
              padding: '1px 6px', borderRadius: 6,
              border: `1px solid ${theme.border}`, background: theme.surfaceBright,
            }}>
              Late · 0 pts
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 18 }}>
            {item.weight_kg.toFixed(1)} kg
          </span>
          {item.change != null && <WeightBadge change={item.change} />}
        </div>
        <ScalePhotoThumb url={photoUrl} weight={item.weight_kg} />
        <div style={{
          fontFamily: theme.bd, fontSize: 13, color: theme.textSec,
          lineHeight: 1.5, marginBottom: 8,
        }}>
          {item.note}
        </div>
        <ReactionPills
          reactions={reactions}
          myReactions={myReactions}
          onToggle={onToggleReaction}
        />
      </div>
    </div>
  );
}

function ScalePhotoThumb({ url, weight }) {
  if (url) {
    return (
      <img
        src={url}
        alt="Scale"
        style={{
          width: 64, height: 48, borderRadius: 8, objectFit: 'cover',
          border: `1px solid ${theme.border}`, display: 'block', marginBottom: 8,
        }}
      />
    );
  }
  // Fallback placeholder mirrors the design when the URL isn't ready yet
  // (or the row predates a successful upload).
  return (
    <div style={{
      width: 64, height: 48, borderRadius: 8, background: theme.surfaceBright,
      border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: 9, fontFamily: theme.hd, fontWeight: 700 }}>
          {Number(weight).toFixed(1)}
        </span>
        <span style={{ fontSize: 7, fontFamily: theme.hd, fontWeight: 500, color: theme.textMut }}>
          kg
        </span>
      </div>
    </div>
  );
}

function relativeTimeLabel(submittedAt, now = new Date()) {
  const ts = new Date(submittedAt);
  const todayYMD = todayInBrisbaneYMD(now);
  const submittedYMD = todayInBrisbaneYMD(ts);
  const yesterdayYMD = todayInBrisbaneYMD(new Date(now.getTime() - 86400000));

  if (submittedYMD === todayYMD) {
    const mins = Math.max(0, Math.floor((now - ts) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  if (submittedYMD === yesterdayYMD) {
    return `Yesterday ${brisbaneClock(ts)}`;
  }
  const [y, m, d] = submittedYMD.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return `${WEEKDAY_SHORT[dt.getUTCDay()]} ${d} ${MONTH_SHORT[m - 1]}`;
}

function brisbaneClock(date) {
  // Hand-format HH:MMam/pm in Brisbane time without trusting locale day-period
  // capitalization (some Node ICUs emit 'AM', some 'am').
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === 'hour').value;
  const minute = parts.find((p) => p.type === 'minute').value;
  const dayPeriod = parts.find((p) => p.type === 'dayPeriod').value.toLowerCase();
  return `${hour}:${minute}${dayPeriod}`;
}
