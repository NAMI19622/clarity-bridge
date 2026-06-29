'use client';

import React from 'react';
import type { ExplanationDraft } from '../lib/types';
import { gateColor, gateLabel } from '../lib/format';

interface Props {
  drafts: ExplanationDraft[];
  activeId: string | null;
  onSelect: (d: ExplanationDraft) => void;
}

// The crossings already attempted for this kernel, newest first. Each row is one
// draft that crossed the bridge, tagged with the fidelity verdict it settled to.
export default function DraftList({ drafts, activeId, onSelect }: Props) {
  if (drafts.length === 0) {
    return (
      <div style={{ color: 'var(--mist-3)', fontSize: '0.8rem', lineHeight: 1.5 }}>
        No crossings yet. Compose an explanation draft above and send it across
        the bridge to see how faithfully it carries the meaning.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {drafts.map((d) => {
        const active = d.id === activeId;
        const color = d.evaluated ? gateColor(d.gateResult) : 'var(--mist-3)';
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 'var(--radius-m)',
              border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
              background: active ? 'rgba(93,235,255,0.06)' : 'rgba(255,255,255,0.02)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                flexShrink: 0,
                background: color,
                boxShadow: d.evaluated ? `0 0 8px ${color}` : 'none',
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--paper-2)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {d.simplifiedExplanation || d.id}
              </div>
              <div style={{ fontSize: '0.64rem', color, letterSpacing: '0.05em' }}>
                {d.evaluated ? gateLabel(d.gateResult) : 'pending evaluation'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
