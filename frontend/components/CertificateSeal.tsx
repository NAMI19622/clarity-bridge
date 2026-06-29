'use client';

import React from 'react';
import { gateLabel, gateColor, bps } from '../lib/format';

interface Props {
  gate: string;
  proofHash: string;
  fidelityBps: number;
  caveatRetentionBps: number;
  audienceName: string;
  animate?: boolean;
}

// A clarity certificate seal: a faceted lens medallion that stamps the verdict,
// the fidelity score, and the proof hash once a draft crosses the bridge intact.
export default function CertificateSeal({
  gate,
  proofHash,
  fidelityBps,
  caveatRetentionBps,
  audienceName,
  animate = true,
}: Props) {
  const color = gateColor(gate);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          width: 138,
          height: 138,
          animation: animate ? 'cb-seal 520ms cubic-bezier(0.22,1,0.36,1) both' : 'none',
        }}
      >
        <svg viewBox="0 0 138 138" width="138" height="138">
          <defs>
            <radialGradient id="lens" cx="42%" cy="38%" r="72%">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="65%" stopColor={color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={color} stopOpacity="0.28" />
            </radialGradient>
          </defs>
          {/* faceted lens ring */}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const x1 = 69 + Math.cos(a) * 52;
            const y1 = 69 + Math.sin(a) * 52;
            const a2 = ((i + 1) / 16) * Math.PI * 2;
            const x2 = 69 + Math.cos(a2) * 52;
            const y2 = 69 + Math.sin(a2) * 52;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity="0.5" strokeWidth="1" />
            );
          })}
          <circle cx="69" cy="69" r="50" fill="url(#lens)" />
          <circle cx="69" cy="69" r="44" fill="none" stroke="rgba(5,6,10,0.5)" strokeWidth="1.2" strokeDasharray="2 5" />
          <circle cx="69" cy="69" r="33" fill="rgba(5,6,10,0.3)" />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'var(--ink)',
            padding: '0 14px',
          }}
        >
          <span style={{ fontSize: '0.54rem', letterSpacing: '0.12em', opacity: 0.85 }}>CERTIFIED</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.7rem', lineHeight: 1.05 }}>
            {gateLabel(gate)}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: '0.7rem', color: 'var(--mist)' }}>
        <span>Fidelity {bps(fidelityBps)}</span>
        <span>Caveats {bps(caveatRetentionBps)}</span>
      </div>
      <div className="mono" style={{ fontSize: '0.64rem', color: 'var(--mist-2)' }} title={proofHash}>
        {proofHash}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--mist-3)' }}>for {audienceName}</div>
    </div>
  );
}
