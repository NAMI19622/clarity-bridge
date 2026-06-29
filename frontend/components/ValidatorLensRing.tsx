'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ValidatorResult } from '../lib/types';
import { VALIDATOR_LABELS } from '../lib/config';

interface Props {
  validators: ValidatorResult[];
  active?: boolean;
}

// The deterministic fidelity validators as a vertical column of lens rings. Each
// ring focuses on one invariant the model cannot override; it glows green when
// the check holds, red when it blocks, gold when it warns.
export default function ValidatorLensRing({ validators, active = false }: Props) {
  if (!validators || validators.length === 0) {
    return (
      <div style={{ color: 'var(--mist-3)', fontSize: '0.8rem', lineHeight: 1.5 }}>
        No evaluation yet. When a draft crosses the bridge, each lens re-checks the
        verdict against the kernel and reports here.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {validators.map((v, i) => {
        const color = v.passed ? 'var(--truth)' : v.blocks ? 'var(--drift)' : 'var(--gold)';
        return (
          <motion.div
            key={v.validator + i}
            initial={active ? { opacity: 0, x: 16 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: active ? i * 0.1 : 0, duration: 0.3 }}
            style={{
              display: 'flex',
              gap: 11,
              padding: '9px 11px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ flexShrink: 0, position: 'relative', width: 16, height: 16, marginTop: 3 }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 5,
                  borderRadius: 999,
                  background: color,
                  opacity: v.passed ? 0.85 : 0.4,
                }}
              />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {VALIDATOR_LABELS[v.validator] || v.validator}
                </span>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color, textTransform: 'uppercase' }}>
                  {v.passed ? 'focused' : v.blocks ? 'block' : 'warn'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--mist-2)', lineHeight: 1.4 }}>{v.reason}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
