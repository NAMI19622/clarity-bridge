'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../lib/store';
import { api, writeAndWait } from '../lib/genlayer';
import type {
  ConceptKernel,
  AudienceLens,
  ExplanationDraft,
  Evaluation,
  ClarityCertificate,
} from '../lib/types';
import { bps, downloadJson, gateColor, gateDrift, gateLabel } from '../lib/format';

import MeaningBridge from '../components/MeaningBridge';
import CaveatAnchorRow from '../components/CaveatAnchorRow';
import DistortionField from '../components/DistortionField';
import CertificateSeal from '../components/CertificateSeal';
import ValidatorLensRing from '../components/ValidatorLensRing';
import TransactionTheater, { TxPhase } from '../components/TransactionTheater';
import WalletButton from '../components/WalletButton';
import AboutDrawer from '../components/AboutDrawer';
import ConceptForm from '../components/ConceptForm';
import LensForm from '../components/LensForm';
import DraftComposer, { DraftInput } from '../components/DraftComposer';
import DraftList from '../components/DraftList';
import { Button, Toast, Pill } from '../components/ui';

export default function ObservatoryPage() {
  const store = useStore();
  const { concepts, summary, wallet, reducedMotion, setReducedMotion, refresh } = store;

  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [lenses, setLenses] = useState<AudienceLens[]>([]);
  const [drafts, setDrafts] = useState<ExplanationDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<ExplanationDraft | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [certificate, setCertificate] = useState<ClarityCertificate | null>(null);

  const [txPhase, setTxPhase] = useState<TxPhase>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txMessage, setTxMessage] = useState<string | undefined>();
  const [gateProgress, setGateProgress] = useState(-1);
  const [sealAnim, setSealAnim] = useState(false);

  const [showAbout, setShowAbout] = useState(false);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [showLensForm, setShowLensForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'err' } | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((message: string, kind: 'ok' | 'err') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    if (!activeConcept && concepts.length > 0) {
      setActiveConcept(concepts[0].id);
    }
  }, [concepts, activeConcept]);

  const concept: ConceptKernel | undefined = useMemo(
    () => concepts.find((c) => c.id === activeConcept),
    [concepts, activeConcept],
  );

  const loadConceptDetail = useCallback(async (conceptId: string) => {
    try {
      const lensPage = await api.getLensesForConcept(conceptId, 0, 20);
      setLenses(lensPage.items);
    } catch {
      setLenses([]);
    }
    try {
      const draftPage = await api.getDraftsForConcept(conceptId, 0, 20);
      setDrafts(draftPage.items);
    } catch {
      setDrafts([]);
    }
  }, []);

  useEffect(() => {
    if (activeConcept) loadConceptDetail(activeConcept);
    setActiveDraft(null);
    setEvaluation(null);
    setCertificate(null);
  }, [activeConcept, loadConceptDetail]);

  const selectDraft = useCallback(async (d: ExplanationDraft) => {
    setActiveDraft(d);
    setEvaluation(null);
    setCertificate(null);
    setSealAnim(false);
    if (d.evaluated) {
      try {
        const ev = await api.getEvaluation(d.id);
        setEvaluation(ev);
      } catch {
        /* none */
      }
      try {
        const cert = await api.getCertificateForDraft(d.id);
        setCertificate(cert);
      } catch {
        /* none */
      }
    }
  }, []);

  const startGateAnimation = useCallback(() => {
    setGateProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setGateProgress((p) => {
        if (p < 0) return p;
        const next = p + 0.015;
        return next >= 0.98 ? 0.05 : next;
      });
    }, 90);
  }, []);

  const stopGateAnimation = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setGateProgress(-1);
  }, []);

  // Submit a draft, then evaluate it through the fidelity gate. Both are writes.
  const onCompose = useCallback(
    async (draft: DraftInput) => {
      if (!concept) return;
      try {
        if (!wallet) await store.connect();
        setTxPhase('signing');
        setTxMessage('Sealing the explanation draft on-chain.');
        await writeAndWait(
          'submit_explanation_draft',
          [
            draft.id,
            concept.id,
            draft.lensId,
            draft.simplifiedExplanation,
            draft.analogyUsed,
            draft.caveatsIncluded,
            draft.claimsMade,
            draft.intendedUsage,
          ],
          (p) => {
            if (p.hash) setTxHash(p.hash);
            if (p.statusName === 'PENDING') {
              setTxPhase('pending');
              setTxMessage('Draft submitted. Now opening the fidelity gate.');
            }
          },
        );
        await loadConceptDetail(concept.id);
        notify('Draft sealed. Crossing the bridge.', 'ok');

        setTxPhase('signing');
        setTxMessage('Signing the fidelity evaluation. Validators will deliberate.');
        startGateAnimation();
        const { hash } = await writeAndWait('evaluate_explanation_fidelity', [draft.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') {
            setTxPhase('pending');
            setTxMessage('The gate is deliberating. An AI fidelity round can take 1 to 5 minutes.');
          }
        });
        stopGateAnimation();
        setTxPhase('accepted');
        setTxHash(hash);
        setTxMessage('Verdict settled. The evaluation is recorded on-chain.');

        const updated = await api.getDraft(draft.id);
        await selectDraft(updated);
        setSealAnim(true);
        await loadConceptDetail(concept.id);
        await refresh();
        notify('Gate settled: ' + gateLabel(updated.gateResult), 'ok');
      } catch (e: any) {
        stopGateAnimation();
        setTxPhase('error');
        setTxMessage(e?.message || 'The gate did not settle.');
        notify(e?.message || 'Transaction failed.', 'err');
      }
    },
    [concept, wallet, store, loadConceptDetail, notify, refresh, selectDraft, startGateAnimation, stopGateAnimation],
  );

  const evaluateExisting = useCallback(
    async (d: ExplanationDraft) => {
      if (!concept) return;
      try {
        if (!wallet) await store.connect();
        setTxPhase('signing');
        setTxMessage('Signing the fidelity evaluation.');
        startGateAnimation();
        const { hash } = await writeAndWait('evaluate_explanation_fidelity', [d.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') {
            setTxPhase('pending');
            setTxMessage('The gate is deliberating. An AI fidelity round can take 1 to 5 minutes.');
          }
        });
        stopGateAnimation();
        setTxPhase('accepted');
        setTxHash(hash);
        setTxMessage('Verdict settled. The evaluation is recorded on-chain.');
        const updated = await api.getDraft(d.id);
        await selectDraft(updated);
        setSealAnim(true);
        await loadConceptDetail(concept.id);
        await refresh();
        notify('Gate settled: ' + gateLabel(updated.gateResult), 'ok');
      } catch (e: any) {
        stopGateAnimation();
        setTxPhase('error');
        setTxMessage(e?.message || 'The gate did not settle.');
        notify(e?.message || 'Transaction failed.', 'err');
      }
    },
    [concept, wallet, store, loadConceptDetail, notify, refresh, selectDraft, startGateAnimation, stopGateAnimation],
  );

  const sealCertificate = useCallback(async () => {
    if (!activeDraft) return;
    try {
      if (!wallet) await store.connect();
      const certId = 'cert_' + activeDraft.id;
      setTxPhase('signing');
      setTxMessage('Stamping the clarity certificate on-chain.');
      await writeAndWait('create_clarity_certificate', [certId, activeDraft.id], (p) => {
        if (p.hash) setTxHash(p.hash);
        if (p.statusName === 'PENDING') setTxPhase('pending');
      });
      setTxPhase('accepted');
      setTxMessage('Clarity certificate sealed.');
      const cert = await api.getCertificateForDraft(activeDraft.id);
      setCertificate(cert);
      setSealAnim(true);
      await refresh();
      notify('Clarity certificate sealed.', 'ok');
    } catch (e: any) {
      setTxPhase('error');
      notify(e?.message || 'Could not seal the certificate.', 'err');
    }
  }, [activeDraft, wallet, store, refresh, notify]);

  // Bridge geometry derived from the active draft's verdict.
  const fidelity = evaluation ? evaluation.fidelityBps / 10000 : concept ? 0.86 : 0.7;
  const drift = activeDraft?.evaluated ? gateDrift(activeDraft.gateResult) : 0.08;
  const accent = activeDraft?.evaluated ? gateColor(activeDraft.gateResult) : '#5debff';
  const strandCount = concept ? Math.max(3, concept.essentialClaims.length) : 4;

  const missingCaveatIndices = useMemo(() => {
    if (!evaluation) return [];
    return evaluation.missingCaveats.map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  }, [evaluation]);

  const certifiable = activeDraft?.evaluated &&
    (activeDraft.gateResult === 'FAITHFUL' || activeDraft.gateResult === 'FAITHFUL_WITH_CAVEATS');

  const busy = txPhase === 'pending' || txPhase === 'signing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 22px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <BridgeMark />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.04rem', lineHeight: 1 }}>
              ClarityBridge
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--mist-2)' }}>
              Make it simpler without making it false
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 22, fontSize: '0.72rem', color: 'var(--mist-2)' }}>
          <Stat label="Kernels" value={summary?.concepts} />
          <Stat label="Lenses" value={summary?.lenses} />
          <Stat label="Crossings" value={summary?.drafts} />
          <Stat label="Faithful" value={summary?.faithful} />
          <Stat label="Certified" value={summary?.certificates} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title="Toggle reduced motion"
            style={ghostBtn}
          >
            {reducedMotion ? 'Motion off' : 'Motion on'}
          </button>
          <button onClick={() => setShowAbout(true)} style={ghostBtn}>
            About
          </button>
          <WalletButton />
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '264px 1fr 348px', minHeight: 0 }}>
        {/* left rail: concept kernels and their lenses */}
        <aside style={{ borderRight: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
          <RailTitle title="Concept kernels" onAdd={() => setShowConceptForm(true)} />
          <div style={{ display: 'grid', gap: 8, marginBottom: 22 }}>
            {concepts.length === 0 && (
              <div style={{ fontSize: '0.76rem', color: 'var(--mist-3)', lineHeight: 1.5 }}>
                No kernels yet. Seal a concept kernel to anchor one end of a bridge.
              </div>
            )}
            {concepts.map((c) => {
              const active = c.id === activeConcept;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConcept(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '11px 12px',
                    borderRadius: 'var(--radius-m)',
                    border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                    background: active ? 'rgba(93,235,255,0.07)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--paper)' }}>{c.title}</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--mist-2)', marginTop: 2 }}>
                    {c.domain || 'general'} | {c.essentialClaims.length} claims | {c.draftCount} crossings
                  </div>
                </button>
              );
            })}
          </div>

          {concept && (
            <>
              <RailTitle title="Audience lenses" onAdd={() => setShowLensForm(true)} />
              <div style={{ display: 'grid', gap: 7 }}>
                {lenses.length === 0 && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--mist-3)', lineHeight: 1.5 }}>
                    No lenses yet. Add one to define who a simplification is for.
                  </div>
                )}
                {lenses.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      padding: '8px 11px',
                      borderRadius: 'var(--radius-m)',
                      border: '1px solid var(--border-violet)',
                      background: 'rgba(167,139,250,0.05)',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--paper-2)', fontWeight: 600 }}>
                      {l.audienceName}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--mist-2)', marginTop: 1 }}>
                      {l.knowledgeLevel.replace(/_/g, ' ')} | analogy {l.analogyPreference} | caveats {l.caveatRequirement.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* center: the meaning bridge and the crossing composer */}
        <main style={{ overflowY: 'auto', padding: '18px 24px', display: 'grid', gap: 18, alignContent: 'start' }}>
          <section
            style={{
              height: 340,
              borderRadius: 'var(--radius-l)',
              border: '1px solid var(--border)',
              background: 'radial-gradient(620px 420px at 50% 40%, rgba(93,235,255,0.06), transparent 70%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <MeaningBridge
              fidelity={fidelity}
              drift={drift}
              strandCount={strandCount}
              conceptLabel={concept?.title || 'No kernel'}
              draftLabel={activeDraft ? (activeDraft.evaluated ? gateLabel(activeDraft.gateResult) : 'pending') : 'No draft'}
              gateProgress={gateProgress}
              accent={accent}
              reducedMotion={reducedMotion}
            />
            {concept && (
              <div style={{ position: 'absolute', left: 18, bottom: 14, fontSize: '0.7rem', color: 'var(--mist-2)' }}>
                <span style={{ color: 'var(--paper-2)', fontWeight: 600 }}>{concept.title}</span>
                <span style={{ marginLeft: 8 }}>level {concept.allowedSimplificationLevel}</span>
              </div>
            )}
          </section>

          {concept ? (
            <>
              <section style={panel}>
                <SectionTitle title="The original idea" />
                <p style={{ fontSize: '0.86rem', color: 'var(--paper-2)', lineHeight: 1.6 }}>
                  {concept.originalExplanation}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                  {concept.essentialClaims.map((claim, i) => (
                    <Pill key={i} color="var(--cyan)">
                      claim {i + 1}
                    </Pill>
                  ))}
                  {concept.forbiddenOverclaims.map((_, i) => (
                    <Pill key={'o' + i} color="var(--drift)">
                      no overclaim {i + 1}
                    </Pill>
                  ))}
                </div>
              </section>

              <section style={panel}>
                <SectionTitle title="Compose a simplified explanation" />
                <DraftComposer lenses={lenses} busy={busy} onSubmit={onCompose} />
              </section>

              <section style={panel}>
                <SectionTitle title="Crossings for this kernel" />
                <DraftList drafts={drafts} activeId={activeDraft?.id || null} onSelect={selectDraft} />
              </section>
            </>
          ) : (
            <div style={{ ...panel, borderStyle: 'dashed', textAlign: 'center', color: 'var(--mist-3)', padding: 40 }}>
              <p style={{ lineHeight: 1.6, marginBottom: 14 }}>
                Seal a concept kernel to anchor the precise meaning, then draft simplifications and
                watch how faithfully they cross the bridge.
              </p>
              <Button onClick={() => setShowConceptForm(true)}>Seal the first kernel</Button>
            </div>
          )}
        </main>

        {/* right: the fidelity inspector */}
        <aside style={{ borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
          <SectionTitle title="Fidelity gate" />
          {activeDraft ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ ...subPanel }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--paper-2)', lineHeight: 1.5 }}>
                  {activeDraft.simplifiedExplanation}
                </div>
                {!activeDraft.evaluated && (
                  <Button onClick={() => evaluateExisting(activeDraft)} disabled={busy} style={{ marginTop: 12, width: '100%' }}>
                    {busy ? 'Crossing...' : 'Send across the bridge'}
                  </Button>
                )}
              </div>

              {activeDraft.evaluated && evaluation && (
                <>
                  <div style={subPanel}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>distortion field</div>
                    <DistortionField
                      drift={drift}
                      distortions={evaluation.distortionTypes}
                      color={gateColor(activeDraft.gateResult)}
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDraft.gateResult}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        ...subPanel,
                        borderColor: gateColor(activeDraft.gateResult),
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: gateColor(activeDraft.gateResult),
                        }}
                      >
                        {gateLabel(activeDraft.gateResult)}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--mist)', marginTop: 6, lineHeight: 1.5 }}>
                        {evaluation.reason}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, fontSize: '0.7rem', color: 'var(--mist-2)' }}>
                        <span>Fidelity {bps(evaluation.fidelityBps)}</span>
                        <span>Clarity {bps(evaluation.clarityBps)}</span>
                        <span>Confidence {bps(evaluation.confidenceBps)}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>caveat anchors</div>
                    <CaveatAnchorRow
                      caveats={concept?.requiredCaveats || []}
                      missingIndices={missingCaveatIndices}
                      active={sealAnim}
                    />
                  </div>

                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>validator lenses</div>
                    <ValidatorLensRing validators={evaluation.validatorSummary} active={sealAnim} />
                  </div>

                  {certificate ? (
                    <div style={{ ...subPanel, display: 'flex', justifyContent: 'center' }}>
                      <CertificateSeal
                        gate={certificate.gate}
                        proofHash={certificate.proofHash}
                        fidelityBps={certificate.fidelityBps}
                        caveatRetentionBps={certificate.caveatRetentionBps}
                        audienceName={certificate.audienceName}
                        animate={sealAnim && !reducedMotion}
                      />
                    </div>
                  ) : certifiable ? (
                    <Button onClick={sealCertificate} disabled={busy} style={{ width: '100%' }}>
                      Seal clarity certificate
                    </Button>
                  ) : (
                    <div style={{ fontSize: '0.74rem', color: 'var(--mist-3)', textAlign: 'center', lineHeight: 1.5 }}>
                      This crossing is not certifiable. Only a faithful crossing can be sealed.
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => downloadJson(`${evaluation.id}.json`, evaluation)}
                    style={{ width: '100%' }}
                  >
                    Export evaluation JSON
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ValidatorLensRing validators={[]} />
          )}
        </aside>
      </div>

      <TransactionTheater phase={txPhase} hash={txHash} message={txMessage} />

      {showAbout && <AboutDrawer onClose={() => setShowAbout(false)} />}
      {showConceptForm && <ConceptForm onClose={() => setShowConceptForm(false)} onDone={notify} />}
      {showLensForm && concept && (
        <LensForm conceptId={concept.id} onClose={() => setShowLensForm(false)} onDone={notify} />
      )}
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--mist)',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-pill)',
  padding: '6px 12px',
};

const panel: React.CSSProperties = {
  borderRadius: 'var(--radius-l)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  padding: 18,
};

const subPanel: React.CSSProperties = {
  padding: 12,
  borderRadius: 'var(--radius-m)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.02)',
};

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span className="mono" style={{ color: 'var(--paper)', fontSize: '0.9rem' }}>
        {value ?? '..'}
      </span>
      <span style={{ fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: '0.66rem',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--mist-2)',
        marginBottom: 14,
      }}
    >
      {title}
    </div>
  );
}

function RailTitle({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: '0.64rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--mist-2)' }}>
        {title}
      </span>
      <button
        onClick={onAdd}
        aria-label={'Add ' + title}
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          border: '1px solid var(--border-strong)',
          background: 'transparent',
          color: 'var(--cyan)',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        +
      </button>
    </div>
  );
}

function BridgeMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <defs>
        <linearGradient id="bridge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5debff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="7" cy="17" r="4" fill="url(#bridge)" />
      <circle cx="27" cy="17" r="4" fill="none" stroke="url(#bridge)" strokeWidth="1.6" strokeDasharray="2 3" />
      <path d="M7 17 C 14 8, 20 26, 27 17" fill="none" stroke="url(#bridge)" strokeWidth="1.6" />
      <path d="M7 17 C 14 26, 20 8, 27 17" fill="none" stroke="url(#bridge)" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}
