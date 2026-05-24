import React from 'react';
import { theme, ACCENT } from '../../lib/theme';

export default function StepDots({ step, total }) {
  const dotInactive = 'rgba(255,255,255,0.12)';
  const lineInactive = 'rgba(255,255,255,0.08)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div
            style={{
              width: i <= step ? 10 : 8,
              height: i <= step ? 10 : 8,
              borderRadius: '50%',
              background: i <= step ? ACCENT : dotInactive,
              boxShadow: i === step ? `0 0 8px ${ACCENT}55` : 'none',
              transition: 'all 0.3s',
            }}
          />
          {i < total - 1 && (
            <div
              style={{
                width: 40,
                height: 2,
                borderRadius: 1,
                background: i < step ? ACCENT + '88' : lineInactive,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
