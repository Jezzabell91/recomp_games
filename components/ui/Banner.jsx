import React from 'react';
import { theme } from '../../lib/theme';

export default function Banner({ accent = '#FFA500', icon = '📸', onClick, children }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        background: accent + '12',
        border: `1px solid ${accent}28`,
        borderRadius: 12,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div
        style={{
          flex: 1,
          fontFamily: theme.hd,
          fontWeight: 600,
          fontSize: 13,
          color: accent,
        }}
      >
        {children}
      </div>
      {clickable && (
        <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0, opacity: 0.6 }}>
          <path
            d="M1 1l5 5-5 5"
            stroke={accent}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
