import React from 'react';
import { theme, ACCENT } from '../../lib/theme';

export default function Button({
  variant = 'primary',
  full = false,
  small = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  style = {},
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: small ? '10px 16px' : '13px 24px',
        background: isPrimary ? ACCENT : 'transparent',
        color: isPrimary ? theme.bg : ACCENT,
        border: isPrimary ? 'none' : `1.5px solid ${ACCENT}55`,
        borderRadius: theme.radButton,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        fontFamily: theme.hd,
        fontWeight: 600,
        fontSize: small ? 13 : 15,
        width: full ? '100%' : undefined,
        boxSizing: 'border-box',
        boxShadow: isPrimary && !disabled ? theme.buttonShadow() : 'none',
        transition: 'opacity 0.15s, transform 0.05s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
