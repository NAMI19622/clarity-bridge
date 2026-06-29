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

// A device-pixel-ratio aware canvas. Two cores (the precise Concept Kernel on the
// left, the simplified Draft on the right) are joined by meaning strands. As
// fidelity falls and drift rises, the strands bow, fray, and desaturate, and the
// distortion field between them warps. This is the semantic bridge metaphor.
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

      const leftX = w * 0.16;
      const rightX = w * 0.84;
      const midY = h * 0.5;
      const coreR = Math.min(w, h) * 0.085;
      const span = rightX - leftX;
      const strands = Math.max(3, Math.min(strandCount, 9));

      const sag = (1 - fidelity) * h * 0.22 + drift * h * 0.16;
      const fray = drift;

      // distortion field: a faint warped grid living between the cores
      ctx.save();
      ctx.globalAlpha = 0.16 + drift * 0.22;
      const cols = 14;
      const rows = 6;
      for (let gx = 0; gx <= cols; gx++) {
        ctx.beginPath();
        for (let gy = 0; gy <= rows; gy++) {
          const nx = gx / cols;
          const ny = gy / rows;
          const baseX = leftX + nx * span;
          const baseY = h * 0.2 + ny * h * 0.6;
          const warp =
            Math.sin(nx * 6 + t.current + ny * 2) * (8 + drift * 34) * (0.4 + fray);
          const x = baseX;
          const y = baseY + warp * Math.sin(nx * Math.PI);
          if (gy === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const fieldCol = drift > 0.5 ? driftCol : a;
        ctx.strokeStyle = `rgba(${fieldCol.r},${fieldCol.g},${fieldCol.b},0.5)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.restore();

      // meaning strands
      for (let i = 0; i < strands; i++) {
        const f = strands === 1 ? 0.5 : i / (strands - 1);
        const yOff = (f - 0.5) * coreR * 2.4;
        const sx = leftX + coreR * 0.7;
        const sy = midY + yOff;
        const ex = rightX - coreR * 0.7;
        const ey = midY + yOff;
        // a strand that frays drifts vertically and loses tautness
        const frayPhase = Math.sin(t.current * 1.4 + i * 1.3);
        const cpX = (sx + ex) / 2;
        const cpY =
          midY + yOff + sag * (0.5 + 0.5 * Math.sin(i)) + frayPhase * fray * 26;

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

      // meaning pulse traveling along the central strand during evaluation
      if (gateProgress >= 0) {
        const p = gateProgress;
        const sx = leftX + coreR * 0.7;
        const ex = rightX - coreR * 0.7;
        const cpX = (sx + ex) / 2;
        const cpY = midY + sag * 0.5;
        const mt = 1 - p;
        const x = mt * mt * sx + 2 * mt * p * cpX + p * p * ex;
        const y = mt * mt * midY + 2 * mt * p * cpY + p * p * midY;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${a.r},${a.g},${a.b},0.95)`;
        ctx.shadowColor = `rgba(${a.r},${a.g},${a.b},0.9)`;
        ctx.shadowBlur = 22;
        ctx.fill();
      }

      // the two cores
      const drawCore = (cx: number, solid: boolean) => {
        ctx.save();
        ctx.translate(cx, midY);
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
      drawCore(leftX, true);
      drawCore(rightX, false);

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
          left: '16%',
          top: '50%',
          transform: 'translate(-50%, 38px)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: 130,
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--cyan)' }}>concept core</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--paper-2)', fontWeight: 600 }}>{conceptLabel}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '84%',
          top: '50%',
          transform: 'translate(-50%, 38px)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: 130,
        }}
      >
        <div className="eyebrow" style={{ color: 'var(--violet)' }}>simplified draft</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--paper-2)', fontWeight: 600 }}>{draftLabel}</div>
      </div>
    </div>
  );
}
