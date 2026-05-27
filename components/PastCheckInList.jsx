import React from 'react';
import { theme } from '../lib/theme';
import { weekNumber, weekRangeLabel } from '../lib/dates';

// items: [{ week_start, weight_kg, note, awarded_value (nullable) }]
// "Late" is derived from awarded_value === null — same single-source-of-truth
// derivation Activity uses, so the trigger's 30-min Tue grace can never make
// surfaces disagree.
export default function PastCheckInList({ items, emptyMessage = 'No check-ins yet' }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ fontFamily: theme.bd, fontSize: 13, color: theme.textMut, padding: '8px 2px' }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.map((it, i) => {
        const late = it.awarded_value == null;
        return (
          <div
            key={it.week_start}
            style={{
              padding: '12px 2px',
              borderBottom: i < items.length - 1 ? `1px solid ${theme.sep}` : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 13, color: theme.textSec }}>
                Week {weekNumber(it.week_start)} · {weekRangeLabel(it.week_start)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {late && (
                  <span
                    style={{
                      fontFamily: theme.hd,
                      fontWeight: 500,
                      fontSize: 10,
                      color: theme.textMut,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    Late
                  </span>
                )}
                <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 16, color: theme.accent }}>
                  {Number(it.weight_kg).toFixed(1)} kg
                </span>
              </div>
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: theme.bd,
                fontSize: 13,
                color: theme.textSec,
                lineHeight: 1.45,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {it.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
