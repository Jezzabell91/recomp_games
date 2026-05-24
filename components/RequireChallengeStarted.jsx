import RequireAuth from './RequireAuth';
import ComingSoon from './ComingSoon';
import { isBeforeChallengeStart } from '../lib/dates';

// Wraps RequireAuth and renders <ComingSoon /> in place of `children` when
// the challenge hasn't started yet. Applied to every /app/*, /activity, and
// /profile/* route. NOT applied to /admin (Jeremy needs access pre-launch) or
// /leaderboard (public, harmless when empty).
export default function RequireChallengeStarted({ children }) {
  return (
    <RequireAuth>
      {isBeforeChallengeStart() ? <ComingSoon /> : children}
    </RequireAuth>
  );
}
