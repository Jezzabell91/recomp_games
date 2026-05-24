import React from 'react';
import { theme } from '../../lib/theme';

export default function WeightBadge({ change }) {
  if (change == null || Number.isNaN(change)) return null;
  const isLoss = change <= 0;

  return (
    <span
      style={{
        fontSize: 12,
        fontFamily: theme.hd,
        fontWeight: 600,
        color: isLoss ? theme.positive : theme.textSec,
        padding: '2px 8px',
        borderRadius: 6,
        background: isLoss ? theme.positive + '15' : 'rgba(255,255,255,0.06)',
      }}
    >
      {isLoss ? '↓' : '↑'} {Math.abs(change).toFixed(1)} kg
    </span>
  );
}
