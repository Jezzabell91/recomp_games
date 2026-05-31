import React, { useState } from 'react';
import { theme } from '../../lib/theme';
import Lightbox from './Lightbox';

const POSES = ['front', 'side', 'back'];

// Shared starting-photos thumbnail row. `photos` is an object keyed by pose
// (`front` / `side` / `back`) mapping to a signed URL. Missing keys render as
// camera-icon placeholders so the row layout stays stable while photos are
// still pending upload. Tapping a thumbnail opens a fullscreen Lightbox.
export default function StartingPhotosRow({
  photos = {},
  title = 'Starting Photos',
  collapsible = false,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [zoomed, setZoomed] = useState(null); // { src, alt } | null
  const isOpen = collapsible ? open : true;
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={isOpen}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', padding: 0,
              color: 'inherit', cursor: 'pointer', font: 'inherit',
            }}
          >
            <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 17 }}>
              {title}
            </span>
            <span
              aria-hidden="true"
              style={{
                fontFamily: theme.hd, fontSize: 12, color: theme.textSec,
                transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 120ms ease',
                display: 'inline-block', lineHeight: 1,
              }}
            >
              ›
            </span>
          </button>
        ) : (
          <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 17 }}>
            {title}
          </span>
        )}
      </div>
      {isOpen && (
      <div style={{ display: 'flex', gap: 10 }}>
        {POSES.map((pose) => {
          const url = photos[pose];
          const tile = {
            flex: 1, aspectRatio: '3/4', borderRadius: 12,
            background: theme.surfaceBright,
            border: `1px solid ${theme.border}`,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
          };
          if (url) {
            return (
              <button
                key={pose}
                type="button"
                onClick={() => setZoomed({ src: url, alt: pose })}
                aria-label={`View ${pose} starting photo`}
                style={{ ...tile, padding: 0, cursor: 'zoom-in' }}
              >
                <img
                  src={url}
                  alt={pose}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            );
          }
          return (
            <div key={pose} style={tile}>
              <span style={{ fontSize: 22 }}>📷</span>
              <span style={{
                fontFamily: theme.hd, fontWeight: 500, fontSize: 11,
                color: theme.textMut, textTransform: 'capitalize',
              }}>
                {pose}
              </span>
            </div>
          );
        })}
      </div>
      )}
      <Lightbox src={zoomed?.src} alt={zoomed?.alt} onClose={() => setZoomed(null)} />
    </div>
  );
}
