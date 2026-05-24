import React from 'react';
import { theme } from '../../lib/theme';

export default function Page({ appBar, bottomNav, children, padX = 16 }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bgGrad,
        color: theme.text,
        fontFamily: theme.bd,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {appBar}
      <div style={{ flex: 1, padding: `0 ${padX}px`, paddingBottom: bottomNav ? 0 : 24 }}>
        {children}
      </div>
      {bottomNav}
    </div>
  );
}
