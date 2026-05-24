import React from 'react';
import { theme, ACCENT } from '../../lib/theme';
import Card from './Card';

export default function WeightSparkline({ history = [], start, current, color = ACCENT }) {
  if (!history.length || start == null || current == null) return null;

  const totalChange = current - start;
  const isLoss = totalChange <= 0;
  const lineColor = color;
  const gradId = 'wg-' + lineColor.replace('#', '');

  const weights = history.map((h) => h.weight);
  const minW = Math.min(...weights) - 0.3;
  const maxW = Math.max(...weights) + 0.3;
  const range = maxW - minW || 1;
  const svgW = 280;
  const svgH = 60;
  const pad = 5;

  const pts = history.map((h, i) => {
    const x = history.length > 1 ? (i / (history.length - 1)) * svgW : svgW / 2;
    const y = pad + ((maxW - h.weight) / range) * (svgH - pad * 2);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, week: h.week };
  });

  const polyStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const fillStr = `${polyStr} ${svgW},${svgH} 0,${svgH}`;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span style={{ fontFamily: theme.hd, fontWeight: 600, fontSize: 15, color: theme.text }}>
          Weight Progress
        </span>
        <span
          style={{
            fontFamily: theme.hd,
            fontWeight: 600,
            fontSize: 13,
            color: isLoss ? theme.positive : theme.textSec,
          }}
        >
          {isLoss ? '↓' : '↑'} {Math.abs(totalChange).toFixed(1)} kg total
        </span>
      </div>

      <Card accent={lineColor}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 14,
          }}
        >
          <div>
            <span style={{ fontFamily: theme.hd, fontWeight: 700, fontSize: 28, color: theme.text }}>
              {current}
            </span>
            <span
              style={{
                fontFamily: theme.hd,
                fontWeight: 500,
                fontSize: 14,
                color: theme.textMut,
                marginLeft: 4,
              }}
            >
              kg
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: theme.textMut, fontFamily: theme.hd }}>
              Started at
            </div>
            <div
              style={{
                fontFamily: theme.hd,
                fontWeight: 600,
                fontSize: 14,
                color: theme.textSec,
              }}
            >
              {start} kg
            </div>
          </div>
        </div>

        <svg
          width="100%"
          height="60"
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={fillStr} fill={`url(#${gradId})`} />
          <polyline
            points={polyStr}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((pt, i) => {
            const isLast = i === pts.length - 1;
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={isLast ? 4 : 3}
                fill={lineColor}
                stroke={isLast ? theme.bg : 'none'}
                strokeWidth={isLast ? 2 : 0}
              />
            );
          })}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {history.map((w) => (
            <span
              key={w.week}
              style={{
                fontFamily: theme.hd,
                fontWeight: 500,
                fontSize: 10,
                color: theme.textMut,
              }}
            >
              Wk {w.week}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
