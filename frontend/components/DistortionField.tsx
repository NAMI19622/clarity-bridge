'use client';

import React from 'react';
import { DISTORTION_LABELS } from '../lib/config';

interface Props {
  // 0..1 amount the field is bent by the verdict
  drift: number;
  distortions: string[];
  color: string;
}

// A compact SVG distortion field. A reference baseline (the original meaning)
// stays straight; a second line bends by the drift amount to show how far the
// simplification pulled the meaning. Detected distortion types are listed below.
export default function DistortionField({ drift, distortions, color }: Props) {
  const w = 300;
  const h = 92;
  const mid = h / 2;
  const bend = drift * (h * 0.36);
  const path = `M 8 ${mid} C ${w * 0.32} ${mid - bend}, ${w * 0.6} ${mid + bend}, ${w - 8} ${mid}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden>
        <line x1="8" y1={mid} x2={w - 8} y2={mid} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <circle cx="8" cy={mid} r="4" fill="var(--cyan)" />
        <circle cx={w - 8} cy={mid} r="4" fill="var(--violet)" />
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--mist-3)',
          marginTop: 2,
        }}
      >
        <span>original meaning</span>
        <span style={{ color }}>{Math.round(drift * 100)}% drift</span>
        <span>delivered meaning</span>
      </div>
      {distortions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {distortions.map((d) => (
            <span
              key={d}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid rgba(248,113,113,0.4)',
                color: 'var(--drift)',
                fontSize: '0.64rem',
              }}
            >
              {DISTORTION_LABELS[d] || d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
