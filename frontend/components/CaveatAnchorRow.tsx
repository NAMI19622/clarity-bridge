'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  // every required caveat from the kernel
  caveats: string[];
  // indices of caveats that are missing from the draft
  missingIndices: number[];
  active?: boolean;
}

// A row of caveat anchors along the bridge deck. An anchor lights gold when its
// caveat is retained in the draft, and goes dark red when the caveat was dropped.
export default function CaveatAnchorRow({ caveats, missingIndices, active = false }: Props) {
  if (!caveats || caveats.length === 0) {
    return (
      <div style={{ color: 'var(--mist-3)', fontSize: '0.78rem', lineHeight: 1.5 }}>
        This kernel declares no required caveats. Anchors light up here once a
        kernel carries caveats that a draft must keep.
      </div>
    );
  }
  const missing = new Set(missingIndices);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {caveats.map((cav, i) => {
        const retained = !missing.has(i);
        const color = retained ? 'var(--gold)' : 'var(--drift)';
        return (
          <motion.div
            key={i}
            initial={active ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: active ? i * 0.1 : 0, duration: 0.3 }}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '9px 11px',
              borderRadius: 'var(--radius-m)',
              border: `1px solid ${retained ? 'var(--border)' : 'rgba(248,113,113,0.4)'}`,
              background: retained ? 'rgba(247,201,72,0.05)' : 'rgba(248,113,113,0.06)',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                marginTop: 3,
                width: 12,
                height: 12,
                borderRadius: 3,
                transform: 'rotate(45deg)',
                background: color,
                boxShadow: retained ? `0 0 10px ${color}` : 'none',
                opacity: retained ? 1 : 0.6,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--paper-2)', lineHeight: 1.4 }}>{cav}</div>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
                {retained ? 'anchored' : 'adrift'}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
