// Recomp Games — Shared Data & Components

// ── Sample Data ─────────────────────────────────────
const RECOMP = {
  currentWeek: 12,
  totalWeeks: 26,
  weekRange: '12–18 Aug',
  deadline: 'Mon 12:00 AM',
  deadlineZone: 'AEST',
  countdown: { d: 1, h: 14, m: 23 },
  userName: 'Jeremy',
  participants: [
    { name: 'Lachie', points: 142, weeks: 12, color: '#4FC3F7' },
    { name: 'Jeremy', points: 138, weeks: 11, color: '#FFD700', isYou: true },
    { name: 'Brodie', points: 135, weeks: 12, color: '#66BB6A' },
    { name: 'Tom', points: 128, weeks: 11, color: '#FF7043' },
    { name: 'Mitch', points: 121, weeks: 10, color: '#AB47BC' },
    { name: 'Dan', points: 115, weeks: 12, color: '#26C6DA' },
    { name: 'Andrew', points: 108, weeks: 9, color: '#EF5350' },
    { name: 'Sam', points: 95, weeks: 10, color: '#FFA500' },
  ],
  pastCheckIns: [
    { week: 11, range: '5–11 Aug', weight: 85.2, note: 'Solid week, 4x gym sessions' },
    { week: 10, range: '29 Jul–4 Aug', weight: 85.8, note: 'Birthday weekend, back on track' },
  ],
  feedItems: [
    { name: 'Lachie', color: '#4FC3F7', time: '2h ago', week: 12, weight: 82.1, change: -0.3, note: 'Feeling strong, 5 gym sessions this week', reactions: { '🔥': 3, '💪': 2 } },
    { name: 'Brodie', color: '#66BB6A', time: '5h ago', week: 12, weight: 91.4, change: -0.5, note: 'Back on track after last week', reactions: { '🔥': 1 } },
    { name: 'Dan', color: '#26C6DA', time: 'Yesterday', week: 12, weight: 76.8, change: 0.2, note: 'Busy week, only made it to gym twice', reactions: { '👏': 2 } },
    { name: 'Jeremy', color: '#FFD700', isYou: true, time: 'Yesterday', week: 12, weight: 84.5, change: -0.7, note: 'Good week — hit the gym 4x and stayed on track', reactions: { '🔥': 4, '💪': 1, '👏': 2 } },
    { name: 'Andrew', color: '#EF5350', time: '2d ago', week: 12, weight: 95.2, change: -1.1, note: 'Big drop! New meal prep routine paying off', reactions: { '🔥': 5, '💪': 3 } },
  ],
  weightData: {
    'Lachie':  { start: 84.0, current: 82.1, history: [
      { week: 8, weight: 83.5 }, { week: 9, weight: 83.1 }, { week: 10, weight: 82.8 }, { week: 11, weight: 82.4 }, { week: 12, weight: 82.1 }] },
    'Jeremy':  { start: 89.2, current: 84.5, history: [
      { week: 8, weight: 87.0 }, { week: 9, weight: 86.4 }, { week: 10, weight: 85.8 }, { week: 11, weight: 85.2 }, { week: 12, weight: 84.5 }] },
    'Brodie':  { start: 95.0, current: 91.4, history: [
      { week: 8, weight: 93.2 }, { week: 9, weight: 92.8 }, { week: 10, weight: 92.1 }, { week: 11, weight: 91.9 }, { week: 12, weight: 91.4 }] },
    'Tom':     { start: 78.5, current: 76.2, history: [
      { week: 8, weight: 77.8 }, { week: 9, weight: 77.2 }, { week: 10, weight: 76.9 }, { week: 11, weight: 76.5 }, { week: 12, weight: 76.2 }] },
    'Mitch':   { start: 102.0, current: 97.5, history: [
      { week: 8, weight: 100.1 }, { week: 9, weight: 99.3 }, { week: 10, weight: 98.7 }, { week: 11, weight: 98.0 }, { week: 12, weight: 97.5 }] },
    'Dan':     { start: 75.0, current: 76.8, history: [
      { week: 8, weight: 75.5 }, { week: 9, weight: 76.0 }, { week: 10, weight: 76.2 }, { week: 11, weight: 76.6 }, { week: 12, weight: 76.8 }] },
    'Andrew':  { start: 100.5, current: 95.2, history: [
      { week: 8, weight: 98.0 }, { week: 9, weight: 97.1 }, { week: 10, weight: 96.5 }, { week: 11, weight: 96.3 }, { week: 12, weight: 95.2 }] },
    'Sam':     { start: 88.0, current: 85.5, history: [
      { week: 8, weight: 87.2 }, { week: 9, weight: 86.8 }, { week: 10, weight: 86.1 }, { week: 11, weight: 85.9 }, { week: 12, weight: 85.5 }] },
  },
};

// ── Theme Helper ────────────────────────────────────
function rcTheme(accent = '#FFD700', dark = true) {
  return {
    accent,
    accentDim: accent + '18',
    accentBorder: accent + '33',
    bg: dark ? '#0b0f1a' : '#f2f2f7',
    bgGrad: dark
      ? 'linear-gradient(180deg, #10081e 0%, #0b0f1a 50%)'
      : 'linear-gradient(180deg, #eaeaf2 0%, #f2f2f7 50%)',
    surface: dark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    surfaceBright: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
    border: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    text: dark ? '#fff' : '#111',
    textSec: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    textMut: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)',
    sep: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    navBg: dark ? 'rgba(8,10,20,0.94)' : 'rgba(242,242,247,0.94)',
    shadow: dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
    dark,
    hd: "'Fredoka', sans-serif",
    bd: "'DM Sans', sans-serif",
  };
}

// ── Avatar ──────────────────────────────────────────
function RCAvatar({ name, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(145deg, ${color}, ${color}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
      fontSize: size * 0.4, color: '#fff', letterSpacing: -0.5,
      border: `2px solid ${color}44`, flexShrink: 0,
    }}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}

// ── Button ──────────────────────────────────────────
function RCBtn({ children, accent = '#FFD700', variant = 'primary', full, small, style = {} }) {
  const isPri = variant === 'primary';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: small ? '10px 16px' : '13px 24px',
      background: isPri ? accent : 'transparent',
      color: isPri ? '#0b0f1a' : accent,
      border: isPri ? 'none' : `1.5px solid ${accent}55`,
      borderRadius: 12, cursor: 'pointer',
      fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
      fontSize: small ? 13 : 15,
      width: full ? '100%' : undefined, boxSizing: 'border-box',
      boxShadow: isPri ? `0 4px 16px ${accent}28` : 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Glass Card ──────────────────────────────────────
function RCCard({ children, accent, theme, glow, style = {} }) {
  const t = theme;
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${accent ? accent + '28' : t.border}`,
      borderRadius: 16, padding: '18px 16px',
      position: 'relative', overflow: 'hidden',
      boxShadow: glow ? `0 0 24px ${accent}10, ${t.shadow}` : t.shadow,
      ...style,
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.6,
        }} />
      )}
      {children}
    </div>
  );
}

// ── Alert Banner ────────────────────────────────────
function RCBanner({ children, accent = '#FFA500', theme, icon = '📸' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      background: accent + '12',
      border: `1px solid ${accent}28`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, fontFamily: theme.hd, fontWeight: 600, fontSize: 13, color: accent }}>
        {children}
      </div>
      <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0, opacity: 0.6 }}>
        <path d="M1 1l5 5-5 5" stroke={accent} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ── Bottom Nav ──────────────────────────────────────
function RCBottomNav({ accent, theme, active = 'home' }) {
  const t = theme;
  const tabs = [
    { id: 'home', label: 'Home',
      path: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5v-5.5a1.5 1.5 0 00-1.5-1.5h-4a1.5 1.5 0 00-1.5 1.5V21H4a1 1 0 01-1-1V10.5z',
      fill: true },
    { id: 'activity', label: 'Activity',
      path: 'M22 12h-4l-3 9L9 3l-3 9H2',
      fill: false },
    { id: 'leaderboard', label: 'Leaderboard',
      path: 'M8 21V11h8v10M4 21V14h4M16 21V8h4v13M2 21h20',
      fill: false },
    { id: 'profile', label: 'Profile',
      path: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.7-8 6h16c0-3.3-3.6-6-8-6z',
      fill: true },
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 20,
      background: t.navBg,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${t.sep}`,
      padding: '8px 0 26px',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(tab => {
        const on = tab.id === active;
        const c = on ? accent : t.textMut;
        return (
          <div key={tab.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            minWidth: 56,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24">
              {tab.fill
                ? <path d={tab.path} fill={c} />
                : <path d={tab.path} stroke={c} strokeWidth="2" fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
            <span style={{
              fontFamily: t.hd, fontWeight: on ? 600 : 500,
              fontSize: 10, color: c,
            }}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── App Bar ─────────────────────────────────────────
function RCAppBar({ accent, theme, userName = 'Jeremy' }) {
  const t = theme;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '56px 18px 6px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          fontSize: 18, color: accent,
          filter: `drop-shadow(0 0 6px ${accent}55)`,
        }}>★</span>
        <span style={{
          fontFamily: t.hd, fontWeight: 700, fontSize: 15,
          color: accent, letterSpacing: 1.5,
        }}>RECOMP</span>
      </div>
      <RCAvatar name={userName} color={accent} size={30} />
    </div>
  );
}

// ── Step Indicator ──────────────────────────────────
function RCStepDots({ step, total, accent, theme }) {
  const t = theme;
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 0,
    }}>
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div style={{
            width: i <= step ? 10 : 8,
            height: i <= step ? 10 : 8,
            borderRadius: '50%',
            background: i <= step
              ? accent
              : (t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
            boxShadow: i === step ? `0 0 8px ${accent}55` : 'none',
            transition: 'all 0.3s',
          }} />
          {i < total - 1 && (
            <div style={{
              width: 40, height: 2, borderRadius: 1,
              background: i < step
                ? accent + '88'
                : (t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Weight Progress Card (shared) ───────────────
function RCWeightProgress({ accent, theme, color, name }) {
  var t = theme;
  var wd = RECOMP.weightData[name];
  if (!wd) return null;

  var start = wd.start;
  var current = wd.current;
  var history = wd.history;
  var totalChange = current - start;
  var isLoss = totalChange <= 0;
  var lineColor = color || accent;
  var gradId = 'wg-' + lineColor.replace('#', '');

  var weights = history.map(function(h) { return h.weight; });
  var minW = Math.min.apply(null, weights) - 0.3;
  var maxW = Math.max.apply(null, weights) + 0.3;
  var range = maxW - minW || 1;
  var svgW = 280, svgH = 60, pad = 5;

  var pts = history.map(function(h, i) {
    var x = history.length > 1 ? (i / (history.length - 1)) * svgW : svgW / 2;
    var y = pad + ((maxW - h.weight) / range) * (svgH - pad * 2);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, week: h.week };
  });

  var polyStr = pts.map(function(p) { return p.x + ',' + p.y; }).join(' ');
  var fillStr = polyStr + ' ' + svgW + ',' + svgH + ' 0,' + svgH;

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10
      }}>
        <span style={{ fontFamily: t.hd, fontWeight: 600, fontSize: 15 }}>
          Weight Progress
        </span>
        <span style={{
          fontFamily: t.hd, fontWeight: 600, fontSize: 13,
          color: isLoss ? '#66BB6A' : t.textSec
        }}>
          {isLoss ? '↓' : '↑'} {Math.abs(totalChange).toFixed(1)} kg total
        </span>
      </div>

      <RCCard accent={lineColor} theme={t}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: 14
        }}>
          <div>
            <span style={{ fontFamily: t.hd, fontWeight: 700, fontSize: 28 }}>
              {current}
            </span>
            <span style={{
              fontFamily: t.hd, fontWeight: 500, fontSize: 14,
              color: t.textMut, marginLeft: 4
            }}>kg</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: t.textMut, fontFamily: t.hd }}>Started at</div>
            <div style={{
              fontFamily: t.hd, fontWeight: 600, fontSize: 14, color: t.textSec
            }}>{start} kg</div>
          </div>
        </div>

        <svg width="100%" height="60" viewBox={'0 0 ' + svgW + ' ' + svgH}
          preserveAspectRatio="none" style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={fillStr} fill={'url(#' + gradId + ')'} />
          <polyline points={polyStr} fill="none" stroke={lineColor}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map(function(pt, i) {
            var isLast = i === pts.length - 1;
            return (
              <circle key={i} cx={pt.x} cy={pt.y}
                r={isLast ? 4 : 3} fill={lineColor}
                stroke={isLast ? t.bg : 'none'}
                strokeWidth={isLast ? 2 : 0} />
            );
          })}
        </svg>

        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 6
        }}>
          {history.map(function(w) {
            return (
              <span key={w.week} style={{
                fontFamily: t.hd, fontWeight: 500, fontSize: 10, color: t.textMut
              }}>Wk {w.week}</span>
            );
          })}
        </div>
      </RCCard>
    </div>
  );
}

Object.assign(window, {
  RECOMP, rcTheme,
  RCAvatar, RCBtn, RCCard, RCBanner,
  RCBottomNav, RCAppBar, RCStepDots, RCWeightProgress,
});
