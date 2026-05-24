import { Link } from 'react-router-dom';
import { theme } from '../lib/theme';

// Placeholder for pages that aren't built yet — Phase 0 wires routes so later
// phases can drop in real implementations without touching main.jsx.
export default function Stub({ title, phase, subtitle }) {
  return (
    <div style={wrap}>
      <div style={tag}>{title}</div>
      <div style={msg}>Coming in Phase {phase}</div>
      {subtitle && <div style={sub}>{subtitle}</div>}
      <Link to="/app" style={back}>← Back to Home</Link>
    </div>
  );
}

const wrap = {
  minHeight: '100vh',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  textAlign: 'center', padding: '24px 32px',
  background: theme.bgGrad, color: theme.text,
};
const tag = {
  fontFamily: theme.hd, fontWeight: 700, fontSize: 22,
  color: theme.accent, marginBottom: 8,
};
const msg = {
  fontFamily: theme.bd, fontSize: 14, color: theme.textSec, marginBottom: 4,
};
const sub = {
  fontFamily: theme.bd, fontSize: 12, color: theme.textMut, marginBottom: 24,
  fontVariantNumeric: 'tabular-nums',
};
const back = {
  marginTop: 24,
  fontFamily: theme.hd, fontWeight: 600, fontSize: 14,
  color: theme.accent, textDecoration: 'none',
  padding: '10px 18px', border: `1.5px solid ${theme.accent}55`,
  borderRadius: 12,
};
