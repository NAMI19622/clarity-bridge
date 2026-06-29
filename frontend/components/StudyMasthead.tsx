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

// A printed-journal masthead for a translator's fidelity desk. It is built from
// ruled hairlines, a small-caps nameplate, an edition line, and a measuring
// gauge that reads the current draft's fidelity against its drift. The controls
// are ruled editorial toggles, not pill buttons, so this chrome can never be
// mistaken for a generic app bar, a folder-tab header, or a broadcast strip.
export default function StudyMasthead({
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
  // so the masthead reads like a living journal that advances with the ledger.
  const edition = useMemo(() => {
    const crossings = summary?.drafts ?? 0;
    const vol = Math.floor(crossings / 12) + 1;
    const no = (crossings % 12) + 1;
    return { vol, no };
  }, [summary]);

  return (
    <header className="study-masthead">
      <div className={reducedMotion ? 'study-rule' : 'study-rule draw'} />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 18,
          padding: '12px 26px 10px',
          flexWrap: 'wrap',
        }}
      >
        {/* nameplate block */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, minWidth: 0 }}>
          <PressMark />
          <div style={{ minWidth: 0 }}>
            <div className="study-smallcaps" style={{ marginBottom: 3 }}>
              the fidelity desk . an editorial study
            </div>
            <div
              className="study-nameplate"
              style={{ fontSize: '1.5rem', color: 'var(--paper)' }}
            >
              claritybridge
            </div>
            <div className="study-serif" style={{ fontSize: '0.7rem', color: 'var(--mist-2)', marginTop: 3 }}>
              make it simpler without making it false
            </div>
          </div>
        </div>

        {/* edition line: vertical ruled separator + journal metadata */}
        <div
          style={{
            alignSelf: 'stretch',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingLeft: 16,
            borderLeft: '1px solid var(--border)',
          }}
        >
          <ColophonItem label="volume" value={'VOL ' + roman(edition.vol)} />
          <ColophonItem label="edition" value={'NO. ' + edition.no} />
          <ColophonItem label="filed" value={(summary?.certificates ?? 0) + ' certified'} />
        </div>

        {/* the fidelity gauge: the signature instrument of the desk */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
          <FidelityGauge
            fidelity={fidelity}
            drift={drift}
            verdictLabel={verdictLabel}
            accent={accent}
            reducedMotion={reducedMotion}
          />

          {/* editorial toggle cluster */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className={'edi-toggle' + (reducedMotion ? '' : ' on')}
              onClick={() => setReducedMotion(!reducedMotion)}
              title="Toggle reduced motion"
              aria-pressed={!reducedMotion}
            >
              {reducedMotion ? 'still press' : 'live press'}
            </button>
            <button className="edi-toggle" onClick={onAbout} style={{ borderLeft: 'none' }}>
              colophon
            </button>
            <span style={{ width: 12 }} />
            <WalletButton />
          </div>
        </div>
      </div>
      {/* a second thin cyan rule closes the nameplate, like a journal footer */}
      <div className="study-rule thin" style={{ opacity: 0.7 }} />
    </header>
  );
}

function ColophonItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1 }}>
      <span
        className="mono"
        style={{ fontSize: '0.78rem', color: 'var(--paper)', letterSpacing: '0.02em' }}
      >
        {value}
      </span>
      <span className="study-smallcaps" style={{ fontSize: '0.54rem' }}>
        {label}
      </span>
    </div>
  );
}

// A measuring gauge: a 180-degree dial whose needle reads fidelity, with a thin
// drift wedge growing from the right. This is the desk's headline instrument.
function FidelityGauge({
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
  const cx = 46;
  const cy = 44;
  const r = 34;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + Math.cos(rad) * r;
  const ny = cy - Math.sin(rad) * r;
  // drift wedge: an arc from the right edge inward, sized by drift
  const driftStart = arcPoint(cx, cy, r, 180 - (1 - d) * 180);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <svg width="92" height="56" viewBox="0 0 92 56" aria-hidden style={{ overflow: 'visible' }}>
        {/* dial track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(184,193,204,0.22)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* fidelity fill from the left to the needle */}
        <path
          d={describeArc(cx, cy, r, 180, angle)}
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* drift wedge from the right edge */}
        {d > 0.02 && (
          <path
            d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 0 ${driftStart.x} ${driftStart.y}`}
            fill="none"
            stroke="var(--drift)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}
        {/* tick marks at quartiles */}
        {[0, 0.25, 0.5, 0.75, 1].map((q) => {
          const ta = ((180 - q * 180) * Math.PI) / 180;
          const x1 = cx + Math.cos(ta) * (r + 3);
          const y1 = cy - Math.sin(ta) * (r + 3);
          const x2 = cx + Math.cos(ta) * (r + 7);
          const y2 = cy - Math.sin(ta) * (r + 7);
          return <line key={q} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--mist-3)" strokeWidth="1" />;
        })}
        {/* needle */}
        <g className={reducedMotion ? undefined : 'needle-settle'} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="3.2" fill="var(--paper)" />
        </g>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1 }}>
        <span className="study-smallcaps" style={{ fontSize: '0.54rem' }}>
          fidelity / drift
        </span>
        <span className="mono" style={{ fontSize: '0.92rem', color: 'var(--paper)' }}>
          {Math.round(f * 100)}
          <span style={{ color: 'var(--mist-3)' }}> / </span>
          <span style={{ color: 'var(--drift)' }}>{Math.round(d * 100)}</span>
        </span>
        <span
          className="study-smallcaps"
          style={{ fontSize: '0.56rem', color: accent, letterSpacing: '0.14em' }}
        >
          {verdictLabel.toLowerCase()}
        </span>
      </div>
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
  // sweeping clockwise over the top from 180 toward 0
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
    <svg width="40" height="44" viewBox="0 0 40 44" aria-hidden>
      <defs>
        <linearGradient id="press" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5debff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="2" y="3" width="36" height="38" fill="none" stroke="rgba(247,201,72,0.55)" strokeWidth="1" />
      <rect x="5.5" y="6.5" width="29" height="31" fill="none" stroke="var(--border)" strokeWidth="1" />
      {/* top nib (precise source) */}
      <path d="M20 11 L24 18 L20 16 L16 18 Z" fill="url(#press)" />
      {/* bottom nib (simplified draft), open form */}
      <path d="M20 33 L16 26 L20 28 L24 26 Z" fill="none" stroke="url(#press)" strokeWidth="1.4" />
      {/* fidelity strand carrying meaning between the nibs */}
      <path d="M20 16 C 13 20, 27 24, 20 28" fill="none" stroke="url(#press)" strokeWidth="1.3" />
    </svg>
  );
}
