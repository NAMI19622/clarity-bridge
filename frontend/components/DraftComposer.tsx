'use client';

import React, { useState } from 'react';
import { Field, TextInput, TextArea, Select, Button, linesToArray } from './ui';
import type { AudienceLens } from '../lib/types';

export interface DraftInput {
  id: string;
  lensId: string;
  simplifiedExplanation: string;
  analogyUsed: string;
  caveatsIncluded: string[];
  claimsMade: string[];
  intendedUsage: string;
}

interface Props {
  lenses: AudienceLens[];
  busy: boolean;
  onSubmit: (draft: DraftInput) => void;
}

// Compose an Audience Explanation draft against a chosen lens, then send it
// across the bridge. Submitting and evaluating are real on-chain writes.
export default function DraftComposer({ lenses, busy, onSubmit }: Props) {
  const [lensId, setLensId] = useState(lenses[0]?.id || '');
  const [simplified, setSimplified] = useState('');
  const [analogy, setAnalogy] = useState('');
  const [caveats, setCaveats] = useState('');
  const [claims, setClaims] = useState('');
  const [usage, setUsage] = useState('');

  const submit = () => {
    const id = 'draft_' + Math.random().toString(36).slice(2, 8);
    onSubmit({
      id,
      lensId: lensId || lenses[0]?.id || '',
      simplifiedExplanation: simplified.trim(),
      analogyUsed: analogy.trim(),
      caveatsIncluded: linesToArray(caveats),
      claimsMade: linesToArray(claims),
      intendedUsage: usage.trim(),
    });
  };

  if (lenses.length === 0) {
    return (
      <div style={{ color: 'var(--mist-3)', fontSize: '0.82rem', lineHeight: 1.5 }}>
        Add an audience lens first. A draft is always written for a specific
        audience, so the gate needs a lens to judge fit.
      </div>
    );
  }

  return (
    <div>
      <Field label="Audience lens">
        <Select value={lensId} onChange={(e) => setLensId(e.target.value)}>
          {lenses.map((l) => (
            <option key={l.id} value={l.id}>
              {l.audienceName} ({l.knowledgeLevel.replace(/_/g, ' ')})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Simplified explanation" hint="The draft the audience will read.">
        <TextArea
          value={simplified}
          onChange={(e) => setSimplified(e.target.value)}
          rows={4}
          placeholder="Explain it simply, without dropping the essential meaning or caveats."
        />
      </Field>
      <Field label="Analogy used" hint="Optional. The gate checks analogies for overstated autonomy.">
        <TextInput value={analogy} onChange={(e) => setAnalogy(e.target.value)} placeholder="It is like ..." />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Caveats included" hint="One per line.">
          <TextArea value={caveats} onChange={(e) => setCaveats(e.target.value)} rows={3} />
        </Field>
        <Field label="Claims made" hint="One per line. Each is checked for grounding in the kernel.">
          <TextArea value={claims} onChange={(e) => setClaims(e.target.value)} rows={3} />
        </Field>
      </div>
      <Field label="Intended usage" hint="Where this explanation will be used.">
        <TextInput value={usage} onChange={(e) => setUsage(e.target.value)} placeholder="school science blog" />
      </Field>
      <Button onClick={submit} disabled={busy || !simplified.trim()} style={{ width: '100%', marginTop: 4 }}>
        {busy ? 'Crossing the bridge...' : 'Submit and cross the bridge'}
      </Button>
    </div>
  );
}
