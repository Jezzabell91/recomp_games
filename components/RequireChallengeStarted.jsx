import RequireAuth from './RequireAuth';
import ComingSoon from './ComingSoon';
import { useAuth } from '../context/AuthProvider';
import { isBeforeChallengeStart } from '../lib/dates';
import { theme } from '../lib/theme';

// Wraps RequireAuth and renders <ComingSoon /> in place of `children` when
// the challenge hasn't started yet. Applied to every /app/*, /activity, and
// /profile/* route. NOT applied to /admin (Jeremy needs access pre-launch) or
// /leaderboard (public, harmless when empty).
//
// Admins bypass the gate so they can smoke-test the participant flows before
// 1 June. Participants still see ComingSoon.
export default function RequireChallengeStarted({ children }) {
  return (
    <RequireAuth>
      <Gate>{children}</Gate>
    </RequireAuth>
  );
}

function Gate({ children }) {
  const { profile } = useAuth();

  // Profile lands after session (separate effect in AuthProvider). Without
  // this wait, an admin would flash ComingSoon for a frame before the real
  // page renders. profile === null also covers the orphan-session case —
  // AuthProvider will sign out, RequireAuth re-evaluates and redirects.
  if (profile === null) return <Splash />;

  if (isBeforeChallengeStart() && !profile.is_admin) return <ComingSoon />;
  return children;
}

function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.bgGrad,
      }}
    >
      <div
        style={{
          fontFamily: theme.hd,
          fontSize: 36,
          color: theme.accent,
          filter: `drop-shadow(0 0 12px ${theme.accent}55)`,
        }}
      >
        ★
      </div>
    </div>
  );
}
