import React from 'react';
import { theme } from '../../lib/theme';

const POSES = ['front', 'side', 'back'];

// Shared starting-photos thumbnail row. `photos` is an object keyed by pose
// (`front` / `side` / `back`) mapping to a signed URL. Missing keys render as
// camera-icon placeholders so the row layout stays stable while photos are
// still pending upload.
export default function StartingPhotosRow({ photos = {}, title = 'Starting Photos' }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 17 }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {POSES.map((pose) => {
          const url = photos[pose];
          return (
            <div
              key={pose}
              style={{
                flex: 1, aspectRatio: '3/4', borderRadius: 12,
                background: theme.surfaceBright,
                border: `1px solid ${theme.border}`,
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {url ? (
                <img
                  src={url}
                  alt={pose}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <>
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span style={{
                    fontFamily: theme.hd, fontWeight: 500, fontSize: 11,
                    color: theme.textMut, textTransform: 'capitalize',
                  }}>
                    {pose}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
