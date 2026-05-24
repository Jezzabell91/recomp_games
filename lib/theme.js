// Design tokens for the Recomp Games dark theme. Single source of truth —
// every component imports from here rather than hard-coding colors/fonts.
// Mirrors design_handoff_recomp_games/recomp-shared.jsx rcTheme(), but drops
// the light branch (we only ship dark).

export const ACCENT = '#FFD700'; // gold — primary brand accent

export const theme = {
  // ── Colors ────────────────────────────────────────
  accent:        ACCENT,
  accentDim:     ACCENT + '18',
  accentBorder:  ACCENT + '33',

  bg:            '#0b0f1a',
  bgGrad:        'linear-gradient(180deg, #10081e 0%, #0b0f1a 50%)',
  surface:       'rgba(255,255,255,0.05)',
  surfaceBright: 'rgba(255,255,255,0.08)',
  border:        'rgba(255,255,255,0.07)',
  sep:           'rgba(255,255,255,0.06)',
  navBg:         'rgba(8,10,20,0.94)',

  text:          '#fff',
  textSec:       'rgba(255,255,255,0.6)',
  textMut:       'rgba(255,255,255,0.35)',

  positive:      '#66BB6A', // weight loss / success. Weight gain uses textSec — never red.
  // No `negative` token by design: weight gain is shown in neutral textSec.

  medalGold:     '#FFD700',
  medalSilver:   '#C0C0C0',
  medalBronze:   '#CD7F32',

  // ── Shadows ───────────────────────────────────────
  shadow:        '0 4px 20px rgba(0,0,0,0.3)',
  glow:          (color = ACCENT) => `0 0 24px ${color}10`,
  buttonShadow:  (color = ACCENT) => `0 4px 16px ${color}28`,

  // ── Typography ────────────────────────────────────
  hd:            "'Fredoka', sans-serif",  // headings, buttons, labels
  bd:            "'DM Sans', sans-serif",  // body copy

  // ── Radii ─────────────────────────────────────────
  radCard:       16,
  radButton:     12,
  radChip:       10,
  radInput:      14,
};
