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
import AboutDrawer from '../components/AboutDrawer';
import StudyMasthead from '../components/StudyMasthead';
import ConceptForm from '../components/ConceptForm';
import LensForm from '../components/LensForm';
import DraftComposer, { DraftInput } from '../components/DraftComposer';
import DraftList from '../components/DraftList';
import { Button, Toast, Pill, Modal } from '../components/ui';

// ClarityBridge reads as an annotated study of two facing texts on a single
// vertical axis: the precise Concept Kernel at the TOP, the simplified
// Explanation Draft at the BOTTOM, and the MeaningBridge canvas in the MIDDLE
// where strands stretch top-to-bottom and the distortion field bends. Selection
// happens in a top picker, results read as a horizontal band below the draft,
// and every form opens as an overlay. There is no left-rail/center/right-rail
// split pane here.
export default function BridgeStudyPage() {
  const store = useStore();
  const { concepts, summary, wallet, reducedMotion, setReducedMotion, refresh } = store;

  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [lenses, setLenses] = useState<AudienceLens[]>([]);
  const [activeLensId, setActiveLensId] = useState<string>('');
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
  const [showComposer, setShowComposer] = useState(false);
  const [showConceptPicker, setShowConceptPicker] = useState(false);
  const [showCrossings, setShowCrossings] = useState(false);
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
      setActiveLensId((prev) => {
        if (prev && lensPage.items.some((l) => l.id === prev)) return prev;
        return lensPage.items[0]?.id || '';
      });
    } catch {
      setLenses([]);
      setActiveLensId('');
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
      setShowComposer(false);
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

  const activeLens = useMemo(
    () => lenses.find((l) => l.id === activeLensId),
    [lenses, activeLensId],
  );

  // headline readout for the masthead fidelity gauge: a settled verdict, a
  // pending crossing, or the kernel baseline when nothing has crossed yet.
  const verdictLabel = activeDraft
    ? activeDraft.evaluated
      ? gateLabel(activeDraft.gateResult)
      : 'pending'
    : concept
      ? 'awaiting draft'
      : 'no kernel';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 64 }}>
      {/* the editorial study masthead: nameplate, edition line, fidelity gauge,
          and ruled editorial toggles. Distinct from every sibling chrome. */}
      <StudyMasthead
        summary={summary}
        fidelity={fidelity}
        drift={drift}
        verdictLabel={verdictLabel}
        accent={accent}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        onAbout={() => setShowAbout(true)}
      />

      {/* top selector bar: choose which kernel is under study and which lens
          frames the simplification. This replaces the old fixed left rail. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 22px',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          background: 'rgba(5,6,10,0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="eyebrow">studying</span>
        <button
          onClick={() => setShowConceptPicker((s) => !s)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-strong)',
            background: 'rgba(93,235,255,0.07)',
            color: 'var(--paper)',
            fontSize: '0.82rem',
            fontWeight: 600,
            maxWidth: 360,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {concept ? concept.title : 'No kernel selected'}
          </span>
          <span style={{ color: 'var(--cyan)', fontSize: '0.7rem' }}>{showConceptPicker ? 'close' : 'change'}</span>
        </button>

        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

        <span className="eyebrow">through lens</span>
        {lenses.length > 0 ? (
          <select
            value={activeLensId}
            onChange={(e) => setActiveLensId(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-violet)',
              background: 'rgba(167,139,250,0.06)',
              color: 'var(--paper)',
              fontSize: '0.8rem',
              maxWidth: 260,
            }}
          >
            {lenses.map((l) => (
              <option key={l.id} value={l.id} style={{ background: 'var(--surface-solid)' }}>
                {l.audienceName} ({l.knowledgeLevel.replace(/_/g, ' ')})
              </option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '0.74rem', color: 'var(--mist-3)' }}>no lens yet</span>
        )}
        {concept && (
          <button onClick={() => setShowLensForm(true)} style={ghostBtn}>
            + lens
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button onClick={() => setShowConceptForm(true)} style={ghostBtn}>
            + new kernel
          </button>
        </div>

        {/* slide-down kernel picker */}
        <AnimatePresence>
          {showConceptPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                flexBasis: '100%',
                marginTop: 8,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8,
              }}
            >
              {concepts.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--mist-3)', lineHeight: 1.5 }}>
                  No kernels yet. Seal a concept kernel to anchor the top of a bridge.
                </div>
              )}
              {concepts.map((c) => {
                const active = c.id === activeConcept;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConcept(c.id);
                      setShowConceptPicker(false);
                    }}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the vertical bridge study: kernel on top, canvas in the middle, draft
          on the bottom, all centered on one reading axis */}
      <main
        style={{
          width: '100%',
          maxWidth: 940,
          margin: '0 auto',
          padding: '26px 22px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 0,
        }}
      >
        {concept ? (
          <>
            {/* TOP: the original Concept Kernel text */}
            <section key={concept.id} className={reducedMotion ? undefined : 'kernel-form'} style={kernelPanel}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--cyan)' }}>concept kernel . original</div>
                  <h2 style={{ fontSize: '1.18rem', marginTop: 4 }}>{concept.title}</h2>
                </div>
                <span style={{ fontSize: '0.66rem', color: 'var(--mist-2)', whiteSpace: 'nowrap' }}>
                  {concept.domain || 'general'} . level {concept.allowedSimplificationLevel}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--paper-2)', lineHeight: 1.62 }}>
                {concept.originalExplanation}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
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
                {concept.requiredCaveats.map((_, i) => (
                  <Pill key={'c' + i} color="var(--gold)">
                    caveat {i + 1}
                  </Pill>
                ))}
              </div>
            </section>

            {/* MIDDLE: the MeaningBridge canvas drawn on the vertical axis */}
            <section
              style={{
                height: 380,
                position: 'relative',
                overflow: 'hidden',
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                background: 'radial-gradient(520px 460px at 50% 50%, rgba(93,235,255,0.06), transparent 70%)',
              }}
            >
              <MeaningBridge
                fidelity={fidelity}
                drift={drift}
                strandCount={strandCount}
                conceptLabel={concept.title}
                draftLabel={activeDraft ? (activeDraft.evaluated ? gateLabel(activeDraft.gateResult) : 'pending') : 'awaiting a draft'}
                gateProgress={gateProgress}
                accent={accent}
                reducedMotion={reducedMotion}
                caveatCount={concept.requiredCaveats.length}
                distortions={evaluation?.distortionTypes || []}
                hasDraft={!!activeDraft}
                canCompose={lenses.length > 0}
                onCompose={() => setShowComposer(true)}
              />
              {activeLens && (
                <div
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 12,
                    fontSize: '0.66rem',
                    color: 'var(--violet)',
                    border: '1px solid var(--border-violet)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 11px',
                    background: 'rgba(167,139,250,0.06)',
                  }}
                >
                  lens: {activeLens.audienceName}
                </div>
              )}
            </section>

            {/* BOTTOM: the simplified Explanation Draft text */}
            <section
              key={activeDraft?.id || 'empty-draft'}
              className={reducedMotion ? undefined : 'draft-settle'}
              style={draftPanel}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div className="eyebrow" style={{ color: 'var(--violet)' }}>explanation draft . simplified</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowCrossings(true)} style={ghostBtn}>
                    Crossings ({drafts.length})
                  </button>
                  <Button onClick={() => setShowComposer(true)} disabled={lenses.length === 0} style={{ padding: '7px 14px' }}>
                    Compose draft
                  </Button>
                </div>
              </div>

              {activeDraft ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--paper-2)', lineHeight: 1.62 }}>
                    {activeDraft.simplifiedExplanation}
                  </p>
                  {activeDraft.analogyUsed && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--mist)', fontStyle: 'italic' }}>
                      analogy: {activeDraft.analogyUsed}
                    </div>
                  )}
                  {!activeDraft.evaluated && (
                    <Button onClick={() => evaluateExisting(activeDraft)} disabled={busy} style={{ justifySelf: 'start' }}>
                      {busy ? 'Crossing...' : 'Send across the bridge'}
                    </Button>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--mist-3)', lineHeight: 1.6 }}>
                  No draft on the lower anchor yet. Compose a simplified explanation for the chosen
                  lens and send it up the bridge to see how faithfully the meaning carries.
                </p>
              )}
            </section>

            {/* horizontal results band below the draft: the verdict reads as a
                row of cards, not a fixed right inspector aside */}
            {activeDraft?.evaluated && evaluation && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 14,
                  marginTop: 22,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDraft.gateResult}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ ...bandCard, borderColor: gateColor(activeDraft.gateResult) }}
                  >
                    <div className="eyebrow" style={{ marginBottom: 8 }}>verdict</div>
                    <div
                      className={reducedMotion ? undefined : 'stamp-in'}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '1.08rem',
                        color: gateColor(activeDraft.gateResult),
                      }}
                    >
                      {gateLabel(activeDraft.gateResult)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--mist)', marginTop: 7, lineHeight: 1.5 }}>
                      {evaluation.reason}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 11, fontSize: '0.7rem', color: 'var(--mist-2)', flexWrap: 'wrap' }}>
                      <span>Fidelity {bps(evaluation.fidelityBps)}</span>
                      <span>Clarity {bps(evaluation.clarityBps)}</span>
                      <span>Confidence {bps(evaluation.confidenceBps)}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div style={bandCard}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>distortion field</div>
                  <DistortionField
                    drift={drift}
                    distortions={evaluation.distortionTypes}
                    color={gateColor(activeDraft.gateResult)}
                  />
                </div>

                <div style={bandCard}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>caveat anchors</div>
                  <CaveatAnchorRow
                    caveats={concept.requiredCaveats || []}
                    missingIndices={missingCaveatIndices}
                    active={sealAnim}
                  />
                </div>

                <div style={bandCard}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>validator lenses</div>
                  <ValidatorLensRing validators={evaluation.validatorSummary} active={sealAnim} />
                </div>

                <div style={{ ...bandCard, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                  <div className="eyebrow">clarity certificate</div>
                  {certificate ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
                    <div style={{ fontSize: '0.74rem', color: 'var(--mist-3)', lineHeight: 1.5 }}>
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
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              ...kernelPanel,
              borderStyle: 'dashed',
              textAlign: 'center',
              color: 'var(--mist-3)',
              padding: 48,
            }}
          >
            <p style={{ lineHeight: 1.6, marginBottom: 16 }}>
              Seal a concept kernel to anchor the precise meaning at the top of the bridge, then
              draft simplifications below and watch how faithfully they cross.
            </p>
            <Button onClick={() => setShowConceptForm(true)}>Seal the first kernel</Button>
          </div>
        )}
      </main>

      {/* the on-chain transaction lifecycle, fixed to the foot of the viewport */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40 }}>
        <TransactionTheater phase={txPhase} hash={txHash} message={txMessage} />
      </div>

      {/* overlays */}
      {showComposer && concept && (
        <Modal title="Compose a simplified explanation" onClose={() => setShowComposer(false)} wide>
          <DraftComposer lenses={lenses} busy={busy} onSubmit={onCompose} />
        </Modal>
      )}
      {showCrossings && (
        <Modal title="Crossings for this kernel" onClose={() => setShowCrossings(false)}>
          <DraftList
            drafts={drafts}
            activeId={activeDraft?.id || null}
            onSelect={(d) => {
              selectDraft(d);
              setShowCrossings(false);
            }}
          />
        </Modal>
      )}
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

// the top kernel anchor: a flat-topped reading panel
const kernelPanel: React.CSSProperties = {
  borderRadius: 'var(--radius-l) var(--radius-l) 0 0',
  border: '1px solid var(--border)',
  borderBottom: 'none',
  background: 'var(--surface)',
  padding: '20px 24px',
};

// the bottom draft anchor: a flat-bottomed reading panel facing the kernel
const draftPanel: React.CSSProperties = {
  borderRadius: '0 0 var(--radius-l) var(--radius-l)',
  border: '1px solid var(--border)',
  borderTop: 'none',
  background: 'var(--surface)',
  padding: '20px 24px',
};

const bandCard: React.CSSProperties = {
  borderRadius: 'var(--radius-l)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  padding: 16,
};

