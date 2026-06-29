'use client';

import React from 'react';
import { Modal } from './ui';
import { CONTRACT_ADDRESS, NETWORK } from '../lib/config';
import { shortAddr } from '../lib/format';

interface Props {
  onClose: () => void;
}

// A short reader's note on what the bridge does and why it lives on GenLayer.
export default function AboutDrawer({ onClose }: Props) {
  return (
    <Modal title="About ClarityBridge" onClose={onClose} wide>
      <div style={{ display: 'grid', gap: 14, fontSize: '0.84rem', color: 'var(--mist)', lineHeight: 1.6 }}>
        <p>
          ClarityBridge is a semantic explanation-fidelity protocol. An author seals a precise
          Concept Kernel: the original idea, its essential claims, the caveats that must be kept,
          and the overclaims that must never appear. A writer then drafts a simplified Audience
          Explanation for a chosen Audience Lens and sends it across the bridge.
        </p>
        <p>
          A GenLayer Fidelity Gate reads the kernel and the draft together and returns one verdict:
          FAITHFUL, FAITHFUL_WITH_CAVEATS, NEEDS_REVISION, OVERCLAIM_RISK, MISLEADING, or
          EXPERT_REVIEW_REQUIRED. The question is not whether two documents match byte for byte. It
          is whether the simplified text still means the same thing. That is a judgment a hash
          cannot make, which is why the judge is an AI run under validator consensus inside the
          contract itself.
        </p>
        <p>
          The model proposes a verdict; deterministic code disposes. After consensus, the contract
          re-derives the evidence from the kernel and the draft text and applies backstops the model
          cannot soften: a dropped essential claim or caveat forces revision, a forbidden overclaim
          forces overclaim risk, an analogy that overstates autonomy forces misleading. Only a
          faithful crossing can be sealed into a Clarity Certificate.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 18,
            flexWrap: 'wrap',
            paddingTop: 6,
            borderTop: '1px solid var(--border)',
            fontSize: '0.74rem',
            color: 'var(--mist-2)',
          }}
        >
          <span>
            Network: <span className="mono">{NETWORK}</span>
          </span>
          <span>
            Contract: <span className="mono">{shortAddr(CONTRACT_ADDRESS)}</span>
          </span>
          <span>No external APIs. No value transfer. Classification only.</span>
        </div>
      </div>
    </Modal>
  );
}
