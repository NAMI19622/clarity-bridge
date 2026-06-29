# Product Boundary

ClarityBridge is a semantic explanation-fidelity protocol. An author seals a
precise Concept Kernel (the original idea, its essential claims, the caveats that
must be kept, and the overclaims that must never appear), defines an Audience
Lens, and submits a simplified Audience Explanation draft. A GenLayer Fidelity
Gate rules whether the simplification preserves the meaning into one of six
verdicts, and a faithful crossing can be sealed into a Clarity Certificate.

## Intelligent Contract owns
- Authoritative storage: concept kernels, audience lenses, explanation drafts,
  fidelity evaluations, distortion records, required revisions, and clarity
  certificates.
- State transition rules: kernel creation; lens creation; draft submission;
  fidelity evaluation; certificate sealing.
- Deterministic input guards: caller checks, existence checks, lens-belongs-to-
  concept checks, length and enum bounds, and the already-evaluated guard before
  any AI call.
- Nondeterministic AI judgment: reading a kernel and a draft together and
  returning a coarse fidelity gate enum, missing-claim and missing-caveat
  indices, overclaim flags, analogy risks, a distortion taxonomy, and three
  basis-point scores (fidelity, clarity, caveat retention).
- Validator comparison: an independent re-run that must agree on the gate enum
  exactly, agree on whether any essential claim is missing, and land within a
  fidelity tolerance.
- Deterministic backstops after consensus, re-derived from the kernel and the
  draft text so every node computes the same facts: a dropped essential claim
  forces NEEDS_REVISION; a dropped required caveat forces NEEDS_REVISION; a
  forbidden overclaim forces OVERCLAIM_RISK; an analogy that overstates autonomy
  forces MISLEADING; dense jargon for a beginner lens forces NEEDS_REVISION; an
  ungrounded claim flags UNSUPPORTED_CLAIM; false certainty against a hedged
  kernel forces revision; and a model finding that contradicts the draft
  evidence is dropped. Backstops can only escalate severity, never soften it.
- Paged read views over kernels, lenses, drafts, evaluations, and certificates.

## Frontend owns
- The knowledge observatory UI and the semantic bridge visual system.
- Wallet connection for writes.
- Read-only previews of kernels, lenses, drafts, evaluations, and certificates.
- Transaction submission and the consensus lifecycle theater.
- Slow paged polling and client-derived stats.
- Help, about, and reduced-motion controls.

## External sources own
- Nothing. ClarityBridge uses no external APIs. The only nondeterminism is
  GenLayer LLM consensus inside the contract.

## Safety scope
- No external content is generated or fetched. The contract only classifies
  whether a supplied simplification preserves a supplied kernel. Demo content is
  safe educational text only.
- No deposits, no staking, no value transfer. Users pay network fees only.
