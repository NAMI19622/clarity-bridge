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
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);
  const t = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.5, active: false });

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

    const draw = () => {
      t.current += reducedMotion ? 0 : 0.01;
      ctx.clearRect(0, 0, w, h);

      // vertical axis: top core (concept) -> bottom core (draft)
      const topY = h * 0.16;
      const bottomY = h * 0.84;
      const midX = w * 0.5;
      const coreR = Math.min(w, h) * 0.07;
      const span = bottomY - topY;
      const strands = Math.max(3, Math.min(strandCount, 9));

      // lateral sag: low fidelity / high drift bows the strands sideways
      const sag = (1 - fidelity) * w * 0.16 + drift * w * 0.12;
      const fray = drift;
      const px = pointer.current.active ? (pointer.current.x - 0.5) : 0;

      // distortion field: a faint warped grid living between the cores,
      // rows running down the span, columns spread across the width
      ctx.save();
      ctx.globalAlpha = 0.16 + drift * 0.22;
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
            Math.sin(ny * 6 + t.current + nx * 2) * (8 + drift * 34) * (0.4 + fray);
          const x = baseX + warp * Math.sin(ny * Math.PI);
          const y = baseY;
          if (gx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fieldCol = drift > 0.5 ? driftCol : a;
        ctx.strokeStyle = `rgba(${fieldCol.r},${fieldCol.g},${fieldCol.b},0.5)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();

      // meaning strands stretched vertically between the two cores
      for (let i = 0; i < strands; i++) {
        const f = strands === 1 ? 0.5 : i / (strands - 1);
        const xOff = (f - 0.5) * coreR * 2.4;
        const sx = midX + xOff;
        const sy = topY + coreR * 0.7;
        const ex = midX + xOff;
        const ey = bottomY - coreR * 0.7;
        // a strand that frays drifts laterally and loses tautness
        const frayPhase = Math.sin(t.current * 1.4 + i * 1.3);
        const cpY = (sy + ey) / 2;
        const cpX =
          midX + xOff + sag * (0.5 + 0.5 * Math.sin(i)) + frayPhase * fray * 26 + px * 30;

        const broken = fray > 0.6 && i % 2 === 0;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpX, cpY, ex, ey);
        const blend = Math.max(0, Math.min(1, fidelity - drift * 0.6));
        const rr = Math.round(driftCol.r + (truth.r - driftCol.r) * blend);
        const gg = Math.round(driftCol.g + (truth.g - driftCol.g) * blend);
        const bb = Math.round(driftCol.b + (truth.b - driftCol.b) * blend);
        const alpha = broken ? 0.18 : 0.5 + fidelity * 0.4;
        ctx.strokeStyle = `rgba(${rr},${gg},${bb},${alpha})`;
        ctx.lineWidth = broken ? 0.8 : 1.4 + fidelity * 1.2;
        ctx.shadowColor = `rgba(${rr},${gg},${bb},0.5)`;
        ctx.shadowBlur = broken ? 0 : 10;
        if (broken) ctx.setLineDash([4, 10]);
        else ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // meaning pulse traveling down the central strand during evaluation
      if (gateProgress >= 0) {
        const p = gateProgress;
        const sy = topY + coreR * 0.7;
        const ey = bottomY - coreR * 0.7;
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
          ctx.strokeStyle = `rgba(${a.r},${a.g},${a.b},0.8)`;
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
  }, [fidelity, drift, strandCount, gateProgress, accent, reducedMotion]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '16%',
          transform: 'translate(-50%, -150%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: 160,
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--cyan)' }}>concept core</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--paper-2)', fontWeight: 600 }}>{conceptLabel}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '84%',
          transform: 'translate(-50%, 60%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: 160,
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--violet)' }}>simplified draft</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--paper-2)', fontWeight: 600 }}>{draftLabel}</div>
      </div>
    </div>
  );
}
