import React from 'react';
import { theme, ACCENT } from '../../lib/theme';

// Shared 3-stat row used by MyProfile and ParticipantProfile.
// rank = 0 means "unknown" (renders as "—").
export default function StatsRow({ points, rank, weeks, totalWk, ownColor = ACCENT }) {
  const medalColor =
    rank === 1 ? theme.medalGold :
    rank === 2 ? theme.medalSilver :
    rank === 3 ? theme.medalBronze :
    theme.textSec;

  const cells = [
    { label: 'Points',    value: String(points),                color: ACCENT },
    { label: 'Rank',      value: rank > 0 ? `#${rank}` : '—',   color: medalColor },
    { label: 'Check-ins', value: `${weeks}/${totalWk}`,         color: ownColor },
  ];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {cells.map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1, padding: '14px 0', textAlign: 'center',
            background: theme.surface, border: `1px solid ${theme.border}`,
            borderRadius: 14,
          }}
        >
          <div style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 22, color: s.color }}>
            {s.value}
          </div>
          <div style={{
            fontFamily: theme.hd, fontWeight: 500, fontSize: 11,
            color: theme.textMut, marginTop: 3,
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
