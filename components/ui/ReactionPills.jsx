import React, { useState, useRef, useEffect } from 'react';
import { theme, ACCENT } from '../../lib/theme';

const PICKER_EMOJIS = ['🔥', '💪', '👏'];

export default function ReactionPills({ reactions = {}, myReactions, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapRef = useRef(null);

  const mine = myReactions instanceof Set ? myReactions : new Set(myReactions || []);

  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [pickerOpen]);

  function handlePick(emoji) {
    setPickerOpen(false);
    if (onToggle) onToggle(emoji);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {Object.entries(reactions).map(([emoji, count]) => {
        if (!count) return null;
        const reacted = mine.has(emoji);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle && onToggle(emoji)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 9px',
              borderRadius: theme.radChip,
              background: reacted ? ACCENT + '18' : theme.surfaceBright,
              border: `1px solid ${reacted ? ACCENT + '55' : theme.border}`,
              fontSize: 12,
              cursor: 'pointer',
              color: theme.text,
            }}
          >
            <span>{emoji}</span>
            <span
              style={{
                fontFamily: theme.hd,
                fontWeight: 600,
                fontSize: 11,
                color: reacted ? ACCENT : theme.textSec,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* The picker is positioned relative to this inner wrapper, not the
          outer row, so it pops up directly above the + button instead of
          floating to the row's right edge and overlapping the note. */}
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Add reaction"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: theme.surfaceBright,
            border: `1px solid ${theme.border}`,
            fontSize: 14,
            color: theme.textMut,
            cursor: 'pointer',
            lineHeight: 1,
            padding: 0,
          }}
        >
          +
        </button>

        {pickerOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: 0,
              display: 'flex',
              gap: 6,
              padding: '6px 8px',
              background: theme.surfaceBright,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radChip,
              boxShadow: theme.shadow,
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {PICKER_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handlePick(emoji)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
