import React from 'react';
import { theme } from '../../lib/theme';

export default function Card({ accent, glow = false, children, style = {} }) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${accent ? accent + '28' : theme.border}`,
        borderRadius: theme.radCard,
        padding: '18px 16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glow && accent ? `${theme.glow(accent)}, ${theme.shadow}` : theme.shadow,
        ...style,
      }}
    >
      {accent && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            opacity: 0.6,
          }}
        />
      )}
      {children}
    </div>
  );
}
