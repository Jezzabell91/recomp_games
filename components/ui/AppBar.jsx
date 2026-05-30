import React from 'react';
import { Link } from 'react-router-dom';
import { theme, ACCENT } from '../../lib/theme';
import Avatar from './Avatar';

export default function AppBar({ userName, avatarSrc, avatarColor = ACCENT }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '56px 18px 6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            fontSize: 18,
            color: ACCENT,
            filter: `drop-shadow(0 0 6px ${ACCENT}55)`,
          }}
        >
          ★
        </span>
        <span
          style={{
            fontFamily: theme.hd,
            fontWeight: 700,
            fontSize: 15,
            color: ACCENT,
            letterSpacing: 1.5,
          }}
        >
          RECOMP
        </span>
      </div>
      <Link
        to="/profile"
        aria-label="My profile"
        style={{ display: 'inline-flex', textDecoration: 'none' }}
      >
        <Avatar name={userName} src={avatarSrc} color={avatarColor} size={30} />
      </Link>
    </div>
  );
}
