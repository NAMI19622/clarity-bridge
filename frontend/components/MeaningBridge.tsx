'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  // 0..1 fidelity of the bridge: 1 keeps strands taut and bright.
  fidelity: number;
  // 0..1 drift of the distortion field: warps the strands as meaning bends.
  drift: number;
  // number of meaning strands stretched between the two cores.
  strandCount: number;
  conceptLabel: string;
  draftLabel: string;
  // gateProgress 0..1: a meaning pulse travels concept -> draft during a round.
  gateProgress?: number;
  accent: string;
  reducedMotion?: boolean;
  // number of required caveats anchored on the span (drawn as anchor ticks).
  caveatCount?: number;
  // distortion type labels to annotate the field when meaning bends.
  distortions?: string[];
  // true once a draft is anchored on the lower core; drives the empty state.
  hasDraft?: boolean;
  // inline empty-state prompt: lets the viewer compose straight from the canvas.
  canCompose?: boolean;
  onCompose?: () => void;
}

function hexToRgb(hex: string) {
  let m = hex.replace('#', '');
  if (m.length === 3) m = m.split('').map((c) => c + c).join('');
  const n = parseInt(m, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// A device-pixel-ratio aware canvas drawn on a VERTICAL axis. The precise
// Concept Kernel core anchors the TOP, the simplified Draft core anchors the
// BOTTOM, and meaning strands stretch top-to-bottom between them. As fidelity
// falls and drift rises, the strands bow sideways, fray, and desaturate, and the
// distortion field warps left-to-right across the span. This is the vertical
// semantic bridge: original above, simplified below, the bend in between.
export default function MeaningBridge({
  fidelity,
  drift,
  strandCount,
  conceptLabel,
  draftLabel,
  gateProgress = -1,
  accent,
  reducedMotion = false,
  caveatCount = 0,
  distortions = [],
  hasDraft = false,
  canCompose = false,
  onCompose,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const t = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.5, active: false });

  // when no draft is anchored, the lower core only holds taut "waiting" strands
  // and the field stays calm, so the span reads as composed, not empty.
  const effFidelity = hasDraft ? fidelity : 0.94;
  const effDrift = hasDraft ? drift : 0.04;
  const strands = Math.max(4, Math.min(Math.round(strandCount), 9));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // pointer reaction: strands lean toward the cursor as it sweeps the span
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = (e.clientX - rect.left) / rect.width;
      pointer.current.y = (e.clientY - rect.top) / rect.height;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    const a = hexToRgb(accent);
    const truth = { r: 110, g: 231, b: 183 };
    const driftCol = { r: 248, g: 113, b: 113 };
    const gold = { r: 247, g: 201, b: 72 };

    const draw = () => {
      t.current += reducedMotion ? 0 : 0.01;
      ctx.clearRect(0, 0, w, h);

      // vertical axis: top core (concept) -> bottom core (draft)
      const topY = h * 0.18;
      const bottomY = h * 0.82;
      const midX = w * 0.5;
      const coreR = Math.min(w, h) * 0.06;
      const span = bottomY - topY;

      // lateral sag: low fidelity / high drift bows the strands sideways
      const sag = (1 - effFidelity) * w * 0.16 + effDrift * w * 0.12;
      const fray = effDrift;
      const px = pointer.current.active ? (pointer.current.x - 0.5) : 0;

      // distortion field: a faint warped grid living between the cores,
      // rows running down the span, columns spread across the width
      ctx.save();
      ctx.globalAlpha = 0.14 + effDrift * 0.22;
      const rows = 14;
      const cols = 6;
      for (let gy = 0; gy <= rows; gy++) {
        ctx.beginPath();
        for (let gx = 0; gx <= cols; gx++) {
          const ny = gy / rows;
          const nx = gx / cols;
          const baseY = topY + ny * span;
          const baseX = w * 0.2 + nx * w * 0.6;
          const warp =
            Math.sin(ny * 6 + t.current + nx * 2) * (8 + effDrift * 34) * (0.4 + fray);
          const x = baseX + warp * Math.sin(ny * Math.PI);
          const y = baseY;
          if (gx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fieldCol = effDrift > 0.5 ? driftCol : a;
        ctx.strokeStyle = `rgba(${fieldCol.r},${fieldCol.g},${fieldCol.b},0.5)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();

      // meaning strands stretched vertically between the two cores. each strand
      // carries one essential claim across the simplification.
      const sy = topY + coreR * 0.9;
      const ey = bottomY - coreR * 0.9;
      for (let i = 0; i < strands; i++) {
        const f = strands === 1 ? 0.5 : i / (strands - 1);
        const xOff = (f - 0.5) * coreR * 3.0;
        const sx = midX + xOff;
        const ex = midX + xOff;
        // a strand that frays drifts laterally and loses tautness
        const frayPhase = Math.sin(t.current * 1.4 + i * 1.3);
        const cpY = (sy + ey) / 2;
        const cpX =
          midX + xOff + sag * (0.5 + 0.5 * Math.sin(i)) + frayPhase * fray * 26 + px * 30;

        const broken = fray > 0.6 && i % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpX, cpY, ex, ey);
        const blend = Math.max(0, Math.min(1, effFidelity - effDrift * 0.6));
        const rr = Math.round(driftCol.r + (truth.r - driftCol.r) * blend);
        const gg = Math.round(driftCol.g + (truth.g - driftCol.g) * blend);
        const bb = Math.round(driftCol.b + (truth.b - driftCol.b) * blend);
        const alpha = broken ? 0.2 : 0.55 + effFidelity * 0.4;
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx.lineWidth = broken ? 0.8 : 1.5 + effFidelity * 1.3;
        ctx.shadowColor = `rgba(${rr},${gg},${bb},0.5)`;
        ctx.shadowBlur = broken ? 0 : 10;
        if (broken) ctx.setLineDash([4, 10]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // a small endpoint node on each strand at the concept core, so the
        // reader can count the claims being carried across.
        ctx.beginPath();
        ctx.arc(sx, sy, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${0.85})`;
        ctx.fill();
      }
      ctx.setLineDash([]);

      // caveat anchors: gold ties pinned along the left margin of the span.
      // a missing/eroded caveat under drift loosens its tie.
      const caveats = Math.max(0, Math.min(caveatCount, 5));
      for (let c = 0; c < caveats; c++) {
        const cy = topY + span * ((c + 1) / (caveats + 1));
        const ax = w * 0.16;
        const loosened = effDrift > 0.5 && c % 2 === 1;
        ctx.beginPath();
        ctx.arc(ax, cy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = loosened
          ? `rgba(${driftCol.r},${driftCol.g},${driftCol.b},0.9)`
          : `rgba(${gold.r},${gold.g},${gold.b},0.9)`;
        ctx.fill();
        // a tie line reaching toward the central strands
        ctx.beginPath();
        ctx.moveTo(ax, cy);
        ctx.lineTo(midX - coreR * 1.2, cy + (loosened ? 6 : 0));
        ctx.strokeStyle = loosened
          ? `rgba(${driftCol.r},${driftCol.g},${driftCol.b},0.4)`
          : `rgba(${gold.r},${gold.g},${gold.b},0.4)`;
        ctx.lineWidth = 1;
        ctx.setLineDash(loosened ? [3, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // distortion knots: red markers on the right margin where meaning bends,
      // one per detected distortion type (capped for legibility).
      const knots = Math.min(distortions.length, 4);
      for (let k = 0; k < knots; k++) {
        const ky = topY + span * (0.28 + 0.5 * (knots === 1 ? 0.5 : k / (knots - 1)));
        const kx = w * 0.84 + Math.sin(t.current + k) * effDrift * 8;
        ctx.beginPath();
        ctx.moveTo(kx - 4, ky - 4);
        ctx.lineTo(kx + 4, ky + 4);
        ctx.moveTo(kx + 4, ky - 4);
        ctx.lineTo(kx - 4, ky + 4);
        ctx.strokeStyle = `rgba(${driftCol.r},${driftCol.g},${driftCol.b},0.85)`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // meaning pulse traveling down the central strand during evaluation
      if (gateProgress >= 0) {
        const p = gateProgress;
        const cpY = (sy + ey) / 2;
        const cpX = midX + sag * 0.5;
        const mt = 1 - p;
        const y = mt * mt * sy + 2 * mt * p * cpY + p * p * ey;
        const x = mt * mt * midX + 2 * mt * p * cpX + p * p * midX;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${a.r},${a.g},${a.b},0.95)`;
        ctx.shadowColor = `rgba(${a.r},${a.g},${a.b},0.9)`;
        ctx.shadowBlur = 22;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // the two cores: solid precise kernel on top, dashed draft below
      const drawCore = (cy: number, solid: boolean) => {
        ctx.save();
        ctx.translate(midX, cy);
        const glow = reducedMotion ? 0.7 : 0.55 + Math.sin(t.current * 1.5) * 0.2;
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, coreR * 2.2);
        grad.addColorStop(0, `rgba(246,241,232,0.95)`);
        grad.addColorStop(0.4, `rgba(${a.r},${a.g},${a.b},${0.5 * glow + 0.28})`);
        grad.addColorStop(1, `rgba(${a.r},${a.g},${a.b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, coreR * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        if (solid) {
          ctx.fillStyle = 'rgba(246,241,232,0.96)';
          ctx.fill();
        } else {
          // an unfilled draft core when nothing has crossed yet reads as a
          // waiting anchor; a filled tint once a draft is present.
          if (hasDraft) {
            ctx.fillStyle = `rgba(${a.r},${a.g},${a.b},0.22)`;
            ctx.fill();
          }
          ctx.strokeStyle = `rgba(${a.r},${a.g},${a.b},0.85)`;
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      };
      drawCore(topY, true);
      drawCore(bottomY, false);

      if (!reducedMotion && document.visibilityState === 'visible') {
        raf.current = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !reducedMotion) {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    draw();
    if (reducedMotion) cancelAnimationFrame(raf.current);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [effFidelity, effDrift, strands, gateProgress, accent, reducedMotion, caveatCount, distortions, hasDraft]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* top core label: the precise source */}
      <CoreTag
        side="top"
        kicker="concept core . source"
        title={conceptLabel}
        color="var(--cyan)"
      />

      {/* bottom core label: the simplified draft or its waiting state */}
      <CoreTag
        side="bottom"
        kicker="draft core . simplified"
        title={draftLabel}
        color="var(--violet)"
      />

      {/* legend for what the marks mean, anchored to the left margin */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <LegendRow color="var(--truth)" label="strands . essential claims" />
        <LegendRow color="var(--gold)" label="anchors . required caveats" />
        <LegendRow color="var(--drift)" label="knots . distortions" />
      </div>

      {/* the running readout of strand and anchor counts, top-left */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          fontSize: '0.6rem',
          color: 'var(--mist-2)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        {strands} strands carried . {Math.max(0, Math.min(caveatCount, 5))} anchors
      </div>

      {/* composed empty state: taut strands already render behind this, so the
          span is never a void. an inline prompt invites the first draft. */}
      {!hasDraft && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            width: 'min(78%, 340px)',
            pointerEvents: 'none',
          }}
        >
          <div
            className="study-smallcaps"
            style={{ fontSize: '0.6rem', color: 'var(--cyan)', marginBottom: 6 }}
          >
            span taut . awaiting a draft
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--mist)', lineHeight: 1.5, marginBottom: 11 }}>
            The kernel is holding {strands} claim strands open. Compose a
            simplified draft to send meaning down the span and read its fidelity.
          </div>
          {canCompose && onCompose && (
            <button
              onClick={onCompose}
              className="edi-toggle on"
              style={{ pointerEvents: 'auto', borderRadius: 0 }}
            >
              compose a draft
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CoreTag({
  side,
  kicker,
  title,
  color,
}: {
  side: 'top' | 'bottom';
  kicker: string;
  title: string;
  color: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        ...(side === 'top' ? { top: 8 } : { bottom: 8 }),
        textAlign: 'center',
        pointerEvents: 'none',
        width: 'min(70%, 280px)',
      }}
    >
      <div className="study-smallcaps" style={{ color, fontSize: '0.58rem' }}>
        {kicker}
      </div>
      <div
        style={{
          fontSize: '0.78rem',
          color: 'var(--paper)',
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, boxShadow: `0 0 7px ${color}` }} />
      <span
        style={{
          fontSize: '0.58rem',
          color: 'var(--mist-2)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}
