// Per-viewer leaderboard sort + standard-competition tied ranks.
//
// Sort: order by (total_points desc, weeks_checked_in desc); when two rows
// are tied on both, the row belonging to `viewerId` floats to the top of
// its tie group. Cosmetic — other viewers see their own row promoted.
//
// Ranking: standard competition ranking ("1, 2, 2, 4"). Rows tied on
// (total_points, weeks_checked_in) share the higher rank; the next rank
// skips ahead by the number of tied rows. The viewer-bubble affects visual
// order within a tie, not the shared rank number, so tied users see the
// same `displayRank` on every screen.
//
// Each returned row has `displayRank` attached (1-indexed). Use that for
// rank display + medal colors; do NOT use the array index, which would
// re-introduce the tiebreak gap the user complained about.
//
// Used on:
//   - Leaderboard (viewer = signed-in user; signed-out → no bubble)
//   - Home mini-leaderboard + "you're #X" pill (viewer = signed-in user)
//   - MyProfile rank (viewer = signed-in user)
//   - ParticipantProfile rank (viewer = the participant being viewed, so
//     their displayRank reflects what they'd see on their own MyProfile)
export function sortLeaderboardForViewer(rows, viewerId) {
  const sorted = [...rows].sort((a, b) => {
    if (a.total_points !== b.total_points) return b.total_points - a.total_points;
    if (a.weeks_checked_in !== b.weeks_checked_in) return b.weeks_checked_in - a.weeks_checked_in;
    if (a.user_id === viewerId) return -1;
    if (b.user_id === viewerId) return 1;
    return 0;
  });

  let currentRank = 0;
  let lastKey = null;
  return sorted.map((row, i) => {
    const key = `${row.total_points}|${row.weeks_checked_in}`;
    if (key !== lastKey) {
      currentRank = i + 1;
      lastKey = key;
    }
    return { ...row, displayRank: currentRank };
  });
}
