import React from 'react';
import { NavLink } from 'react-router-dom';
import { theme, ACCENT } from '../../lib/theme';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    to: '/app',
    path: 'M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5v-5.5a1.5 1.5 0 00-1.5-1.5h-4a1.5 1.5 0 00-1.5 1.5V21H4a1 1 0 01-1-1V10.5z',
    fill: true,
  },
  {
    id: 'activity',
    label: 'Activity',
    to: '/activity',
    path: 'M22 12h-4l-3 9L9 3l-3 9H2',
    fill: false,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    to: '/leaderboard',
    path: 'M8 21V11h8v10M4 21V14h4M16 21V8h4v13M2 21h20',
    fill: false,
  },
  {
    id: 'profile',
    label: 'Profile',
    to: '/profile',
    path: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.4 0-8 2.7-8 6h16c0-3.3-3.6-6-8-6z',
    fill: true,
  },
];

// `active` is explicit (not derived from route) so /profile/:userId can pass
// active="" and get no tab highlighted, per design decision #4.
export default function BottomNav({ active = 'home' }) {
  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 20,
        background: theme.navBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid ${theme.sep}`,
        padding: '8px 0 26px',
        display: 'flex',
        justifyContent: 'space-around',
      }}
    >
      {TABS.map((tab) => {
        const on = tab.id === active;
        const c = on ? ACCENT : theme.textMut;
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              minWidth: 56,
              textDecoration: 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              {tab.fill ? (
                <path d={tab.path} fill={c} />
              ) : (
                <path
                  d={tab.path}
                  stroke={c}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
            <span
              style={{
                fontFamily: theme.hd,
                fontWeight: on ? 600 : 500,
                fontSize: 10,
                color: c,
              }}
            >
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
}
