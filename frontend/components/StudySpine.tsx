'use client';

import React, { useMemo } from 'react';
import type { Summary } from '../lib/types';
import WalletButton from './WalletButton';

interface Props {
  summary: Summary | null;
  // 0..1 fidelity of the draft currently under study (or the kernel baseline).
  fidelity: number;
  // 0..1 drift of the distortion field for the current verdict.
  drift: number;
  // short verdict / state label for the desk readout ("FAITHFUL", "pending"...)
  verdictLabel: string;
  // accent color tied to the active verdict.
  accent: string;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  onAbout: () => void;
}

// ClarityBridge docks its chrome to a narrow LEFT VERTICAL SPINE rather than a
// horizontal top bar. The pressmark, a rotated nameplate, a compact fidelity
// gauge, and the editorial controls (wallet, motion, colophon) all stack top to
// bottom down the gutter rail. The study column then fills the width to the
// right. No sibling dApp uses this spine-on-left structure.
export default function StudySpine({
  summary,
  fidelity,
  drift,
  verdictLabel,
  accent,
  reducedMotion,
  setReducedMotion,
  onAbout,
}: Props) {
  // Edition number is derived from the volume of crossings recorded on-chain,
  // so the spine reads like a living journal that advances with the ledger.
  const edition = useMemo(() => {
    const crossings = summary?.drafts ?? 0;
    const vol = Math.floor(crossings / 12) + 1;
    const no = (crossings % 12) + 1;
    return { vol, no };
  }, [summary]);

  return (
    <aside className="study-spine">
      {/* top: ruled cap + pressmark brand */}
      <div className={reducedMotion ? 'spine-rule' : 'spine-rule draw'} />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
        <PressMark />
      </div>

      {/* the rotated nameplate runs down the spine like a book spine title */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
        <div className="study-nameplate spine-nameplate" style={{ color: 'var(--paper)' }}>
          claritybridge
        </div>
      </div>

      {/* edition colophon, stacked vertically */}
      <div className="spine-edition">
        <SpineColophon label="vol" value={roman(edition.vol)} />
        <SpineColophon label="no" value={String(edition.no)} />
        <SpineColophon label="filed" value={String(summary?.certificates ?? 0)} />
      </div>

      {/* the compact fidelity gauge: the signature instrument of the desk */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <SpineGauge
          fidelity={fidelity}
          drift={drift}
          verdictLabel={verdictLabel}
          accent={accent}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* spacer pushes the controls to the foot of the spine */}
      <div style={{ flex: 1, minHeight: 18 }} />

      {/* control cluster at the foot of the spine */}
      <div className="spine-controls">
        <button
          className={'edi-toggle spine-toggle' + (reducedMotion ? '' : ' on')}
          onClick={() => setReducedMotion(!reducedMotion)}
          title="Toggle reduced motion"
          aria-pressed={!reducedMotion}
        >
          {reducedMotion ? 'still' : 'live'}
        </button>
        <button className="edi-toggle spine-toggle" onClick={onAbout}>
          colophon
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
          <WalletButton menuPlacement="right" />
        </div>
      </div>
      <div className="spine-rule thin" style={{ opacity: 0.7 }} />
    </aside>
  );
}

function SpineColophon({ label, value }: { label: string; value: string }) {
  return (
    <div className="spine-colophon">
      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--paper)' }}>
        {value}
      </span>
      <span className="study-smallcaps" style={{ fontSize: '0.5rem' }}>
        {label}
      </span>
    </div>
  );
}

// A compact measuring gauge for the spine: a 180-degree dial whose needle reads
// fidelity, with a thin drift wedge growing from the right. The numeric readout
// stacks beneath the dial so it fits the narrow rail.
function SpineGauge({
  fidelity,
  drift,
  verdictLabel,
  accent,
  reducedMotion,
}: {
  fidelity: number;
  drift: number;
  verdictLabel: string;
  accent: string;
  reducedMotion: boolean;
}) {
  const f = Math.max(0, Math.min(1, fidelity));
  const d = Math.max(0, Math.min(1, drift));
  // needle sweeps across a half dial: 180deg (left, 0) to 0deg (right, 1)
  const angle = 180 - f * 180;
  const cx = 28;
  const cy = 28;
  const r = 22;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + Math.cos(rad) * r;
  const ny = cy - Math.sin(rad) * r;
  const driftStart = arcPoint(cx, cy, r, 180 - (1 - d) * 180);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="56" height="36" viewBox="0 0 56 36" aria-hidden style={{ overflow: 'visible' }}>
        {/* dial track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(184,193,204,0.22)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* fidelity fill from the left to the needle */}
        <path
          d={describeArc(cx, cy, r, 180, angle)}
          fill="none"
          stroke={accent}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* drift wedge from the right edge */}
        {d > 0.02 && (
          <path
            d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${driftStart.x} ${driftStart.y}`}
            fill="none"
            stroke="var(--drift)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}
        {/* needle */}
        <g className={reducedMotion ? undefined : 'needle-settle'} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--paper)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="2.6" fill="var(--paper)" />
        </g>
      </svg>
      <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--paper)' }}>
        {Math.round(f * 100)}
        <span style={{ color: 'var(--mist-3)' }}>/</span>
        <span style={{ color: 'var(--drift)' }}>{Math.round(d * 100)}</span>
      </span>
      <span
        className="study-smallcaps spine-verdict"
        style={{ fontSize: '0.5rem', color: accent }}
      >
        {verdictLabel.toLowerCase()}
      </span>
    </div>
  );
}

function arcPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r };
}

// Build an SVG arc path from startAngle to endAngle (degrees, measured from the
// positive x axis, sweeping over the top of the dial).
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = arcPoint(cx, cy, r, startAngle);
  const end = arcPoint(cx, cy, r, endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function roman(n: number): string {
  if (n <= 0) return 'I';
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
}

// A pressmark: nib-and-rule emblem for the editorial desk. Two facing nib forms
// linked by a fidelity strand, set in a ruled square plate.
function PressMark() {
  return (
    <svg width="38" height="42" viewBox="0 0 40 44" aria-hidden>
      <defs>
        <linearGradient id="press-spine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5debff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="36" height="38" fill="none" stroke="rgba(247,201,72,0.55)" strokeWidth="1" />
      <rect x="5.5" y="6.5" width="29" height="31" fill="none" stroke="var(--border)" strokeWidth="1" />
      {/* top nib (precise source) */}
      <path d="M20 11 L24 18 L20 16 L16 18 Z" fill="url(#press-spine)" />
      {/* bottom nib (simplified draft), open form */}
      <path d="M20 33 L16 26 L20 28 L24 26 Z" fill="none" stroke="url(#press-spine)" strokeWidth="1.4" />
      {/* fidelity strand carrying meaning between the nibs */}
      <path d="M20 16 C 13 20, 27 24, 20 28" fill="none" stroke="url(#press-spine)" strokeWidth="1.3" />
    </svg>
  );
}
