import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthProvider';
import { theme, ACCENT } from '../lib/theme';
import {
  currentWeekStart,
  weekNumber,
  totalWeeks,
} from '../lib/dates';

import Page from '../components/ui/Page';
import AppBar from '../components/ui/AppBar';
import BottomNav from '../components/ui/BottomNav';
import Avatar from '../components/ui/Avatar';
import WeightSparkline from '../components/ui/WeightSparkline';
import PastCheckInList from '../components/PastCheckInList';
import StatsRow from '../components/ui/StatsRow';
import StartingPhotosRow from '../components/ui/StartingPhotosRow';

export default function MyProfile() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const wkNum = weekNumber(currentWeekStart());
  const totalWk = totalWeeks();

  const [checkIns, setCheckIns]         = useState(null); // ordered desc
  const [photos, setPhotos]              = useState(null); // { front: url, side: url, back: url }
  const [leaderboard, setLeaderboard]    = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const ciPromise = supabase
        .from('check_ins')
        .select(`
          week_start, weight_kg, note,
          points!left(value, week_start, category)
        `)
        .eq('user_id', userId)
        .order('week_start', { ascending: false });

      const ipPromise = supabase
        .from('initial_photos')
        .select('pose, storage_path')
        .eq('user_id', userId);

      const lbPromise = supabase.from('leaderboard').select('*');

      const [ciRes, ipRes, lbRes] = await Promise.all([ciPromise, ipPromise, lbPromise]);
      if (cancelled) return;

      // Check-ins normalised the same way Home / Activity do — pick the matching
      // weekly_checkin row from the embedded points array.
      if (!ciRes.error && ciRes.data) {
        setCheckIns(ciRes.data.map((row) => {
          const matching = (row.points || []).find(
            (p) => p.category === 'weekly_checkin' && p.week_start === row.week_start,
          );
          return {
            week_start:    row.week_start,
            weight_kg:     Number(row.weight_kg),
            note:          row.note,
            awarded_value: matching ? matching.value : null,
          };
        }));
      } else {
        setCheckIns([]);
      }

      // Initial photos — sign all paths in one round trip.
      if (!ipRes.error && ipRes.data) {
        const paths = ipRes.data.map((r) => r.storage_path);
        if (paths.length > 0) {
          const { data: signed } = await supabase.storage
            .from('photos')
            .createSignedUrls(paths, 60 * 60 * 24);
          if (!cancelled) {
            const byPose = {};
            for (const row of ipRes.data) {
              const s = (signed || []).find((x) => x.path === row.storage_path);
              if (s?.signedUrl) byPose[row.pose] = s.signedUrl;
            }
            setPhotos(byPose);
          }
        } else {
          setPhotos({});
        }
      } else {
        setPhotos({});
      }

      if (!lbRes.error && lbRes.data) setLeaderboard(lbRes.data);
      else setLeaderboard([]);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // ── Derived stats ─────────────────────────────────
  const myRow = (leaderboard || []).find((r) => r.user_id === userId);
  const myRank = (leaderboard || []).findIndex((r) => r.user_id === userId) + 1;

  // History for sparkline — earliest → latest. `start` is the very first reading
  // (the baseline shown as "Started at …"); `current` is the latest. We cap the
  // visible history to the last 8 entries so the Wk-label row doesn't crowd
  // once the challenge runs longer.
  const sparkline = useMemo(() => {
    if (!checkIns || checkIns.length === 0) return null;
    const asc = [...checkIns].reverse();
    const baseline = asc[0].weight_kg;
    const latest = asc[asc.length - 1].weight_kg;
    const recent = asc.slice(-8).map((r) => ({
      week:   weekNumber(r.week_start),
      weight: r.weight_kg,
    }));
    return { history: recent, start: baseline, current: latest };
  }, [checkIns]);

  const loading = checkIns === null || photos === null || leaderboard === null;

  return (
    <Page
      appBar={
        <AppBar
          userName={profile?.display_name}
          avatarSrc={profile?.avatar_url}
          avatarColor={profile?.color || ACCENT}
        />
      }
      bottomNav={<BottomNav active="profile" />}
    >
      {loading || !profile ? (
        <div style={{ color: theme.textSec, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
          {/* Hero */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', padding: '8px 0 4px',
          }}>
            <Avatar
              name={profile.display_name}
              src={profile.avatar_url}
              color={profile.color || ACCENT}
              size={72}
            />
            <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 24, marginTop: 12 }}>
              {profile.display_name}
            </div>
            <div style={{
              fontFamily: theme.hd, fontWeight: 500, fontSize: 13,
              color: theme.textSec, marginTop: 4,
            }}>
              {myRank > 0 ? `Rank #${myRank} · ` : ''}Week {wkNum} of {totalWk}
            </div>
          </div>

          <StatsRow
            points={myRow?.total_points ?? 0}
            rank={myRank}
            weeks={myRow?.weeks_checked_in ?? 0}
            totalWk={totalWk}
            ownColor={profile.color || ACCENT}
          />

          {sparkline && (
            <WeightSparkline
              history={sparkline.history}
              start={sparkline.start}
              current={sparkline.current}
              color={profile.color || ACCENT}
            />
          )}

          <StartingPhotosRow photos={photos} />

          <div>
            <div style={{
              fontFamily: theme.hd, fontWeight: 700, fontSize: 17,
              margin: '0 0 10px',
            }}>
              Recent Check-Ins
            </div>
            <PastCheckInList
              items={checkIns}
              emptyMessage="No check-ins yet — your first one shows up here."
            />
          </div>
        </div>
      )}
    </Page>
  );
}
