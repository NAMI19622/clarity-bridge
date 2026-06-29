'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button, linesToArray } from './ui';
import { writeAndWait } from '../lib/genlayer';
import { useStore } from '../lib/store';
import {
  KNOWLEDGE_LEVELS,
  ANALOGY_PREFERENCES,
  RISK_TOLERANCES,
  CAVEAT_REQUIREMENTS,
  TONES,
} from '../lib/config';

interface Props {
  conceptId: string;
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

// Define an Audience Lens: who the explanation is for and how it should read.
// The lens shapes how the gate weighs jargon, analogies, and caveat depth.
export default function LensForm({ conceptId, onClose, onDone }: Props) {
  const { wallet, connect, refresh } = useStore();
  const [busy, setBusy] = useState(false);

  const [id, setId] = useState('lens_' + Math.random().toString(36).slice(2, 7));
  const [name, setName] = useState('');
  const [knowledge, setKnowledge] = useState('beginner');
  const [vocab, setVocab] = useState('');
  const [analogy, setAnalogy] = useState('light');
  const [risk, setRisk] = useState('medium');
  const [caveatReq, setCaveatReq] = useState('key_only');
  const [tone, setTone] = useState('neutral');

  const submit = async () => {
    if (!name.trim()) {
      onDone('An audience name is required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      await writeAndWait('create_audience_lens', [
        id.trim(),
        conceptId,
        name.trim(),
        knowledge,
        linesToArray(vocab),
        analogy,
        risk,
        caveatReq,
        tone,
      ]);
      await refresh();
      onDone('Audience lens added.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Failed to create the lens.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add an audience lens" onClose={onClose}>
      <Field label="Lens id">
        <TextInput value={id} onChange={(e) => setId(e.target.value)} />
      </Field>
      <Field label="Audience name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Curious teenagers" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Knowledge level">
          <Select value={knowledge} onChange={(e) => setKnowledge(e.target.value)}>
            {KNOWLEDGE_LEVELS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tone">
          <Select value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Analogy preference">
          <Select value={analogy} onChange={(e) => setAnalogy(e.target.value)}>
            {ANALOGY_PREFERENCES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Risk tolerance">
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            {RISK_TOLERANCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Caveat requirement">
        <Select value={caveatReq} onChange={(e) => setCaveatReq(e.target.value)}>
          {CAVEAT_REQUIREMENTS.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Allowed vocabulary" hint="Optional. One word or phrase per line the audience already knows.">
        <TextArea value={vocab} onChange={(e) => setVocab(e.target.value)} rows={3} />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Adding...' : 'Add lens'}
        </Button>
      </div>
    </Modal>
  );
}
