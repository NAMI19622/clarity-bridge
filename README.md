# ClarityBridge

A semantic explanation-fidelity protocol on GenLayer. An author seals a precise
Concept Kernel; a Fidelity Gate then checks that each simplified Audience
Explanation still means the same thing before it can earn a Clarity Certificate.

This README is written as a translator's fidelity codex. Each section is a
Reading, and the recurring device is a pair: an Original phrasing set beside a
Simplified phrasing, with a Margin note recording what survived the crossing and
what was at risk. The unit of value here is meaning, not words.

---

## Frontispiece: what this codex preserves

Simplifying an idea is an act of translation. A good simplification keeps the
claims that matter, carries the caveats that keep it honest, and refuses the
shortcuts that quietly turn it false. A bad simplification reads more smoothly
and means something else.

ClarityBridge exists to judge that difference and to record the judgment on
chain. The author writes down the idea exactly once, as a Concept Kernel. Every
later simplification is measured against that kernel by an AI Fidelity Gate that
runs inside a GenLayer Intelligent Contract under validator consensus. The
question is never "do these two strings match." It is "does the simpler text
still carry the same meaning, caveats, and boundaries."

> Original: An mRNA vaccine teaches your immune system to recognize a harmless
> spike protein; it does not change your DNA, and protection is not absolute.
>
> Simplified: An mRNA vaccine trains your body to spot the virus. It does not
> change your DNA, and it does not make you immune forever.
>
> Margin note: faithful. Both essential claims survive and both caveats are
> carried. This is the kind of crossing the gate is built to certify.

---

## Reading 1: the two texts

ClarityBridge works with two texts and the lens between them.

The Concept Kernel is the original idea, owned and fixed by its author. It holds:
the original explanation in full; the Essential Claims that must survive any
faithful simplification; the Required Caveats that must be retained; the
Forbidden Overclaims that must never appear; the Key Definitions; the Known
Misconceptions that must not be reinforced; and an allowed simplification level.

The Audience Lens describes who a simplification is for: a knowledge level
(expert through child), an analogy preference, a risk tolerance, a caveat
requirement, and a tone. The same kernel can be simplified differently for
different lenses.

The Explanation Draft is one attempt to cross from kernel to audience: the
simplified explanation, an optional analogy, the caveats the writer believes they
included, the claims they believe they made, and the intended usage.

> Original: the kernel as the source text; the draft as the target text.
>
> Simplified: one true idea on the left bank, one simpler retelling on the right
> bank, a lens chosen for the reader on the far side.
>
> Margin note: the bridge metaphor is literal in the interface. The kernel is the
> left core, the draft is the right core, and the strands between them are the
> claims that must survive the trip.

---

## Reading 2: why meaning cannot be hashed

A natural first instinct is to store the original document, hash it, and compare.
That fails immediately here, and the reason is the whole point of the project.

A simplification is supposed to differ from the original. Different words, fewer
words, an analogy the original never used. So byte equality is meaningless: a
faithful simplification and the original never match, and two simplifications
that read almost identically can mean opposite things if one drops the word
"not." A hash tells you the text changed. It cannot tell you whether the meaning
survived. Keyword matching is no better; it rewards copying vocabulary and
punishes honest rephrasing.

Deciding fidelity requires reading both texts and judging, in context, whether a
claim was preserved, whether a caveat was quietly dropped, whether an analogy
overstates how much the subject can do, and whether the draft asserts a certainty
the original withheld. That is a language judgment.

This is why GenLayer is essential rather than incidental. GenLayer Intelligent
Contracts can call an AI model as part of on-chain logic, and they reach
agreement on that nondeterministic output through validator consensus: a leader
proposes a verdict, and other validators independently re-run the judgment and
vote on whether to accept it. ClarityBridge puts the language judgment exactly
where the record lives. There is no off-chain oracle to trust, no mock service,
no backend doing the real work. The contract is the backend.

> Original: verification by cryptographic digest of a fixed document.
>
> Simplified: verification by asking, under consensus, whether the meaning made
> it across.
>
> Margin note: the thing being verified is semantic, so the verifier has to be
> able to read. A hash reads nothing.

---

## Reading 3: the six verdicts

The Fidelity Gate settles every crossing into exactly one verdict, ordered here
from most to least faithful:

- FAITHFUL: every essential claim survives, no caveat is lost, no overclaim
  appears.
- FAITHFUL_WITH_CAVEATS: faithful, and the required caveats are carried along.
- NEEDS_REVISION: a claim or caveat was lost, or the draft misfits the audience.
- OVERCLAIM_RISK: the draft states more than the kernel supports.
- MISLEADING: an analogy or shortcut changes the meaning or overstates autonomy.
- EXPERT_REVIEW_REQUIRED: the distortion is subtle and needs a human expert.

The consensus question put to the validators is this: given this Concept Kernel
and this Explanation Draft for this Audience Lens, does the draft preserve the
essential claims, retain the required caveats, avoid the forbidden overclaims,
and fit the audience, and therefore which single verdict applies? Validators
must agree on the verdict enum exactly, agree on whether any essential claim is
missing, and land within a fixed tolerance on the fidelity score. A round that
cannot agree does not settle.

Alongside the verdict the gate records three scores in basis points (fidelity,
clarity, caveat retention), the indices of missing claims and caveats, overclaim
flags, analogy risks, a distortion taxonomy, and required revisions.

> Original: a pass/fail check.
>
> Simplified: a six-way gradient that says not just whether it failed but how the
> meaning bent.
>
> Margin note: the gradient is what lets a writer improve a draft instead of just
> being told no.

---

## Reading 4: the margin notes

Eight validators annotate every crossing. The AI proposes; these checks are the
margin notes that the contract trusts. Each is re-derived deterministically from
the kernel and the draft text after consensus, so every node computes the same
annotation.

- Essential Claim Coverage rejects a draft that dropped an essential claim. A
  dropped claim cannot be called faithful.
- Caveat Retention rejects a draft that lost a required caveat. A lost caveat
  forces NEEDS_REVISION and records MISSING_CAVEAT.
- Overclaim Boundary rejects any forbidden overclaim phrase that appears in the
  draft. It forces OVERCLAIM_RISK and records OVERCLAIM.
- Analogy Safety rejects an analogy that overstates autonomy or agency (for
  example calling the subject sentient, conscious, or fully autonomous). It
  forces MISLEADING and records FALSE_ANALOGY.
- Audience Fit rejects dense jargon aimed at a beginner lens. It forces
  NEEDS_REVISION and records AUDIENCE_MISMATCH.
- Supported Claim rejects a stated claim that is not grounded anywhere in the
  kernel. It records UNSUPPORTED_CLAIM.
- False Certainty rejects a draft that asserts an absolute ("always",
  "guaranteed") where the kernel hedges ("may", "can"). It records
  FALSE_CERTAINTY.
- Evidence Consistency rejects the model's own bad findings: if the model claims
  a caveat is missing but the draft clearly includes it, that finding is dropped
  and this check fails. It keeps the recorded evidence honest.

A note on direction: backstops can only escalate severity, never soften it. The
model can never talk the contract out of a violation it can see in the text.

> Original: a reviewer's checklist applied by hand.
>
> Simplified: eight lenses that each focus on one way meaning slips, re-checked
> by code the model cannot overrule.
>
> Margin note: the model is a strong reader, but it is not the judge of record.
> The judge of record is the deterministic re-derivation.

---

## Reading 5: what the code decides

The contract is `contracts/contract.py`, a single GenLayer Intelligent Contract.

State model. The contract stores Concept Kernels and their order, Audience Lenses
and their order, Explanation Drafts and their order, Evaluations indexed by
draft, and Clarity Certificates indexed by draft. It also keeps counters for the
sequence number, faithful crossings, drafts needing revision, and sealed
certificates.

Write methods and what they mutate:

- `create_concept_kernel` writes a new Concept Kernel: the original explanation,
  essential claims, required caveats, forbidden overclaims, definitions,
  misconceptions, and allowed simplification level. It appends to the kernel
  order.
- `create_audience_lens` writes a new Audience Lens bound to a kernel and
  increments that kernel's lens count.
- `submit_explanation_draft` writes a new Explanation Draft bound to a kernel and
  a lens, marked unevaluated, and increments the kernel's draft count. It rejects
  a lens that does not belong to the kernel.
- `evaluate_explanation_fidelity` runs the AI round and settles the verdict. It
  mutates the draft (evaluated flag, gate result, status) and writes the
  Evaluation with scores, missing claims and caveats, overclaim flags, distortion
  types, the validator summary, the reason, and a proof hash. It updates the
  faithful or revision counter.
- `create_clarity_certificate` seals a Clarity Certificate for a draft, but only
  if the draft was evaluated and settled to FAITHFUL or FAITHFUL_WITH_CAVEATS. It
  increments the certificate count.

Deterministic guards before any AI call: caller is recorded as owner; ids must be
present and unique; the kernel and lens must exist; the lens must belong to the
kernel; required text must be non-empty; enums fall back to safe defaults; text
and list lengths are clamped; and a draft that was already evaluated cannot be
evaluated again. None of these spend an AI round.

Deterministic backstops after consensus: the eight validators of Reading 4 are
re-derived from the kernel and draft text, the verdict is escalated to the most
severe applicable outcome, a faithful family verdict is promoted to
FAITHFUL_WITH_CAVEATS when the kernel carries caveats and they are all present,
the recorded findings are the deterministic truth rather than the model's claims,
and a proof hash is written. Certificate sealing re-checks that the gate result
is certifiable.

View methods: `get_summary`, `get_concepts_page`, `get_concept`,
`get_lenses_for_concept`, `get_drafts_page`, `get_drafts_for_concept`,
`get_draft`, `get_evaluation`, `get_certificate`, and
`get_certificate_for_draft`. All listing views are paged with a capped limit.

> Original: a backend service plus a database plus an AI client.
>
> Simplified: one contract that stores the texts, calls the model, runs the
> checks, and seals the certificate.
>
> Margin note: there is no other backend. Removing the contract removes the
> product.

---

## Reading 6: the observatory

The frontend in `frontend/` is a static Next.js 15 export (App Router, React 19,
TypeScript) styled as a knowledge observatory rather than a landing page. It
reads the contract through genlayer-js with a read-only client and submits writes
through a connected browser wallet.

App shell. A three-pane workspace: a left rail of Concept Kernels and the
Audience Lenses of the active kernel; a center span with the MeaningBridge
canvas, the original idea, the draft composer, and the list of crossings; and a
right Fidelity Gate inspector. A bottom TransactionTheater stages the consensus
lifecycle.

Visual and motion system. The named animations are: a device-pixel-ratio aware
canvas bridge-and-strand loop that paused when the tab is hidden; a
concept-kernel-forming entry sequence as panels rise into place; a
pointer-reactive bridge that responds to the cursor over the canvas; a
transaction lifecycle theater bound to PENDING through ACCEPTED; and an on-chain
update in which the distortion field bends to the verdict, caveat anchors light
or go adrift, and the certificate seal stamps. The custom metaphor components are
MeaningBridge (two cores joined by strands over a warped field), DistortionField
(a delivered-meaning line bending from the original baseline), CaveatAnchorRow
(anchors that hold gold or drift red), ValidatorLensRing (the eight validators as
focusing lenses), and CertificateSeal (a faceted lens medallion). The palette is
deep ink and knowledge navy with clarity gold, bridge cyan, lens violet, truth
green, drift red, and revision blue. The interface respects
prefers-reduced-motion and pauses the canvas when hidden.

> Original: a dashboard with forms and a results table.
>
> Simplified: an observatory where you watch meaning try to cross a bridge.
>
> Margin note: the motion is not decoration; the strands, the field bend, and the
> anchors all read directly from the on-chain verdict.

---

## Reading 7: working copy

Prerequisites: Python with the GenLayer tooling (`genvm-lint`, `gltest`) and
Node.js for the frontend.

Lint the contract:

```
cd clarity-bridge
genvm-lint check contracts/contract.py
```

Run the direct-mode tests (these mock the AI judgment and assert the
deterministic guards and backstops):

```
cd clarity-bridge
python -m pytest tests/direct/ -q
```

The suite covers the eight scenarios end to end: a faithful simplification
settling to FAITHFUL_WITH_CAVEATS, a dropped caveat forcing NEEDS_REVISION, an
overclaim forcing OVERCLAIM_RISK, a false analogy forcing MISLEADING, an audience
mismatch forcing NEEDS_REVISION, an invented claim flagging UNSUPPORTED_CLAIM, a
fake missing-caveat finding dropped by Evidence Consistency, and a faithful draft
sealed into a Clarity Certificate.

Run the frontend locally:

```
cd clarity-bridge/frontend
npm install
npm run dev
```

Build the static export and type-check:

```
cd clarity-bridge/frontend
npx tsc --noEmit
npx next build
```

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local` to the deployed
address once you have one. It ships pointing at the zero address placeholder.

> Original: a long setup chapter.
>
> Simplified: lint, test, build, point at the address.
>
> Margin note: the tests do not need a wallet or a live network; they run the
> contract in an in-memory VM with the model mocked.

---

## Colophon

On-chain coordinates:

- Network: GenLayer Bradbury testnet.
- Live contract address: `0x13cf5282cB0E19eD2279f2a05cFCc90FFa22F03F`.
- Live frontend URL: https://clarity-bridge.pages.dev/
- Source: https://github.com/NAMI19622/clarity-bridge
- Explorer base: https://explorer-bradbury.genlayer.com/address/0x13cf5282cB0E19eD2279f2a05cFCc90FFa22F03F

Deployment notes. `scripts/deploy.py` reads `GENLAYER_PRIVATE_KEY` from the
workspace root `.env`, deploys `contracts/contract.py`, waits for the deploy
transaction to reach ACCEPTED, writes `deployment.json`, and seeds the mandatory
demo concept "GenLayer Intelligent Contracts" with its essential claims, required
caveats, and forbidden overclaims, a beginner audience lens, and two drafts: a
bad draft that overstates autonomy and drops the consensus caveat, and a better
draft that keeps the claims and caveats. `scripts/seed.py` seeds the same content
idempotently against an already-deployed contract. Neither script is run as part
of this build; deployment is performed separately by the operator.

Known limitations. The Fidelity Gate is a judgment aid, not an authority on
truth; it checks whether a simplification preserves a supplied kernel, not
whether the kernel itself is correct. The deterministic backstops use token-
overlap heuristics to detect missing claims, missing caveats, and overclaim
phrases, which are conservative by design and can over-flag a heavily reworded
but faithful draft; the six-way gradient and the human EXPERT_REVIEW_REQUIRED
verdict exist for exactly those edge cases. An AI consensus round takes longer
than an ordinary transaction, typically one to several minutes. ClarityBridge
uses no external APIs, performs no value transfer, and generates no content; it
only classifies the fidelity of text supplied to it.
