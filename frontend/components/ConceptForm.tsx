'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button, linesToArray } from './ui';
import { writeAndWait } from '../lib/genlayer';
import { useStore } from '../lib/store';
import { SIMPLIFICATION_LEVELS } from '../lib/config';

interface Props {
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

// Define a precise Concept Kernel: the original idea plus its essential claims,
// required caveats, and forbidden overclaims. This is the source of truth the
// fidelity gate measures every simplification against.
export default function ConceptForm({ onClose, onDone }: Props) {
  const { wallet, connect, refresh } = useStore();
  const [busy, setBusy] = useState(false);

  const [id, setId] = useState('concept_' + Math.random().toString(36).slice(2, 7));
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [original, setOriginal] = useState('');
  const [essential, setEssential] = useState('');
  const [caveats, setCaveats] = useState('');
  const [overclaims, setOverclaims] = useState('');
  const [definitions, setDefinitions] = useState('');
  const [misconceptions, setMisconceptions] = useState('');
  const [level, setLevel] = useState('moderate');

  const submit = async () => {
    if (!title.trim() || !original.trim()) {
      onDone('A title and an original explanation are required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      await writeAndWait('create_concept_kernel', [
        id.trim(),
        title.trim(),
        domain.trim(),
        original.trim(),
        linesToArray(essential),
        linesToArray(caveats),
        linesToArray(overclaims),
        linesToArray(definitions),
        linesToArray(misconceptions),
        level,
      ]);
      await refresh();
      onDone('Concept kernel sealed on-chain.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Failed to create the concept kernel.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Seal a concept kernel" onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Kernel id">
          <TextInput value={id} onChange={(e) => setId(e.target.value)} />
        </Field>
        <Field label="Domain" hint="e.g. immunology, cryptography, finance">
          <TextInput value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="immunology" />
        </Field>
      </div>
      <Field label="Title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="How mRNA vaccines work" />
      </Field>
      <Field label="Original explanation" hint="The precise idea, in full, before any simplification.">
        <TextArea
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          rows={4}
          placeholder="State the idea exactly as an expert would, with its real boundaries."
        />
      </Field>
      <Field label="Essential claims" hint="One per line. Each must survive any faithful simplification.">
        <TextArea value={essential} onChange={(e) => setEssential(e.target.value)} rows={4} />
      </Field>
      <Field label="Required caveats" hint="One per line. Each must be retained in the draft.">
        <TextArea value={caveats} onChange={(e) => setCaveats(e.target.value)} rows={3} />
      </Field>
      <Field label="Forbidden overclaims" hint="One per line. Phrasings that must never appear.">
        <TextArea value={overclaims} onChange={(e) => setOverclaims(e.target.value)} rows={3} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Key definitions" hint="One per line.">
          <TextArea value={definitions} onChange={(e) => setDefinitions(e.target.value)} rows={3} />
        </Field>
        <Field label="Known misconceptions" hint="One per line. Must not be reinforced.">
          <TextArea value={misconceptions} onChange={(e) => setMisconceptions(e.target.value)} rows={3} />
        </Field>
      </div>
      <Field label="Allowed simplification level">
        <Select value={level} onChange={(e) => setLevel(e.target.value)}>
          {SIMPLIFICATION_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Sealing...' : 'Seal kernel'}
        </Button>
      </div>
    </Modal>
  );
}
