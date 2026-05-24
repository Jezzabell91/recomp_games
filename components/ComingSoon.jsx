import { theme } from '../lib/theme';
import { formatYMDForDisplay, CHALLENGE_START_YMD } from '../lib/dates';

// Pre-challenge gate view. The launch date flows through formatYMDForDisplay
// so it can never drift from CHALLENGE_START_YMD if the constant changes.
// No bottom nav — this is a dead-end view by design.
export default function ComingSoon() {
  return (
    <div style={wrap}>
      <div style={glow} />
      <div style={star}>★</div>
      <div style={tag}>THE RECOMP GAMES</div>
      <div style={headline}>Starts {formatYMDForDisplay(CHALLENGE_START_YMD)}</div>
      <div style={hint}>Starting photos + first check-in open Mon 1 Jun 📷</div>
    </div>
  );
}

const wrap = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  textAlign: 'center', padding: '24px 32px',
  background: 'radial-gradient(circle at center, #1a102e 0%, #0b0f1a 60%)',
  color: theme.text, position: 'relative', overflow: 'hidden',
};

const glow = {
  position: 'absolute', width: 240, height: 240, borderRadius: '50%',
  background: theme.accent + '20', filter: 'blur(40px)',
  pointerEvents: 'none',
};

const star = {
  fontFamily: theme.hd, fontSize: 48, color: theme.accent,
  filter: `drop-shadow(0 0 16px ${theme.accent}88)`,
  marginBottom: 12, position: 'relative',
};

const tag = {
  fontFamily: theme.hd, fontWeight: 700, fontSize: 14,
  color: theme.accent, letterSpacing: 2,
  marginBottom: 32, position: 'relative',
};

const headline = {
  fontFamily: theme.hd, fontWeight: 700, fontSize: 26,
  marginBottom: 14, position: 'relative',
};

const hint = {
  fontFamily: theme.bd, fontSize: 14, color: theme.textSec,
  maxWidth: 280, lineHeight: 1.5, position: 'relative',
};
