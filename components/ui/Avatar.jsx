import React from 'react';
import { theme } from '../../lib/theme';

export default function Avatar({ name, color, size = 36, src }) {
  const initial = name ? name[0].toUpperCase() : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${color}44`,
          flexShrink: 0,
          background: color,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(145deg, ${color}, ${color}88)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.hd,
        fontWeight: 600,
        fontSize: size * 0.4,
        color: '#fff',
        letterSpacing: -0.5,
        border: `2px solid ${color}44`,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
