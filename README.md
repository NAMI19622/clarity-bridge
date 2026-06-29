# ClarityBridge

Make it simpler without making it false.

There is a particular kind of damage that happens when an expert explains
something to a beginner. The expert drops a qualifier to keep the sentence short.
The qualifier was the part that kept the sentence true. The beginner walks away
confident and wrong, and nobody notices, because the simplified version reads
beautifully. ClarityBridge exists to notice.

It works on one premise: a faithful simplification and its original are supposed
to differ in words while agreeing in meaning. That premise is fatal to every
cheap verification trick. You cannot hash the text, because the whole point is
that the text changed. You cannot match keywords, because that rewards copying
vocabulary and punishes honest rephrasing. The only thing that can tell a
faithful simplification from a misleading one is something that reads both and
judges, in context, whether the claims survived, whether the caveats were kept,
whether an analogy quietly promoted the subject into something it is not. That is
a language judgment, and a language judgment is exactly what a normal smart
contract cannot make.

So ClarityBridge puts the judgment where the record is. An author writes the idea
down once, precisely, as a Concept Kernel: the original explanation, the
essential claims that must survive, the caveats that must be retained, the
overclaims that must never appear. Anyone then writes a simplification for a
chosen audience, and a GenLayer Intelligent Contract calls an AI fidelity gate
that reads the simplification against the kernel. Because the verdict is settled
on-chain, it is not one server's opinion: a leader proposes it, validators
independently re-run the reading, and they must agree on the verdict exactly,
agree on whether any essential claim went missing, and land within tolerance on
the fidelity score before it is written. There is no off-chain oracle and no mock
service. The contract is the backend.

The gate does not answer yes or no. It returns one of six gradations, because a
writer trying to improve a draft needs to know not just that it failed but how
the meaning bent. A draft can be FAITHFUL, or FAITHFUL_WITH_CAVEATS when the
required caveats are all carried, or it can slip to NEEDS_REVISION when a claim
or caveat is lost, OVERCLAIM_RISK when it states more than the kernel supports,
MISLEADING when an analogy or shortcut changes the meaning, or
EXPERT_REVIEW_REQUIRED when the distortion is too subtle to settle automatically.
Alongside the verdict the contract records fidelity, clarity, and caveat-retention
scores, the indices of any missing claims and caveats, and a taxonomy of the
distortions it found.

What keeps the verdict honest is that the model never has the last word. After
consensus, eight checks are re-derived deterministically from the kernel and the
draft text, identically on every node, and they can only make a verdict stricter,
never softer. Essential Claim Coverage rejects a draft that dropped a claim.
Caveat Retention forces a revision when a required caveat is gone. Overclaim
Boundary catches forbidden phrasing. Analogy Safety flags an analogy that
overstates autonomy. Audience Fit rejects dense jargon aimed at a beginner.
Supported Claim rejects an assertion the kernel never grounded. False Certainty
catches an absolute where the kernel hedged. And Evidence Consistency polices the
model itself: if it claims a caveat is missing while the draft plainly includes
it, that finding is thrown out. The model is the reader; the deterministic
re-derivation is the judge.

Underneath, the contract (`contracts/contract.py`) stores concept kernels,
audience lenses, explanation drafts, evaluations, and clarity certificates, with
counters for crossings, revisions, and seals. Five writes drive it:
`create_concept_kernel` and `create_audience_lens` and `submit_explanation_draft`
record the texts; `evaluate_explanation_fidelity` runs the only AI round and
settles the verdict; `create_clarity_certificate` seals a draft, but only one
that settled to FAITHFUL or FAITHFUL_WITH_CAVEATS. Guards before the model check
that ids are unique, that the lens belongs to the kernel, that required text is
present, that a draft is not evaluated twice. Reads are free and paged:
`get_summary`, `get_concepts_page`, `get_concept`, `get_lenses_for_concept`,
`get_drafts_page`, `get_drafts_for_concept`, `get_draft`, `get_evaluation`,
`get_certificate`, `get_certificate_for_draft`.

The interface makes the metaphor literal. It is a knowledge observatory built as
a single vertical bridge: the original kernel anchored at the top, the simplified
draft at the bottom, and between them a canvas where each essential claim is a
strand stretched across the span, gold caveat anchors pinned down the margin, and
red knots marking distortions where the meaning bends. The chrome does not sit in
a top bar; it lives in a left vertical spine carrying the pressmark, a rotated
nameplate, a compact fidelity gauge, and the controls. When a draft crosses, the
strands tension or fray, the distortion field warps to the verdict, and a faceted
certificate seal stamps. Deep ink and knowledge navy, clarity gold and bridge
cyan and lens violet; reduced-motion respected, the canvas paused when hidden.

To run it: from `clarity-bridge`, `genvm-lint check contracts/contract.py` and
`python -m pytest tests/direct/ -q` (the suite mocks the AI and asserts the
guards and backstops across all eight scenarios); then in `frontend`,
`npm install` and `npm run dev`, or `npx next build` for the static export. The
tests need no wallet and no network. To deploy, `scripts/deploy.py` reads
`GENLAYER_PRIVATE_KEY` from the workspace `.env`, deploys, waits for ACCEPTED,
and seeds the demo concept "GenLayer Intelligent Contracts" with a bad draft that
overstates autonomy and a better draft that keeps the claims and caveats.

It runs on the GenLayer Bradbury testnet. The deployed contract address and
network are carried in the frontend environment and shown in the observatory's
about panel, so a running instance always declares the contract it reads.

A closing honesty, since the project is about honesty: ClarityBridge checks
whether a simplification preserves a supplied kernel, not whether the kernel is
itself correct. Its backstops use conservative token-overlap heuristics that can
over-flag a heavily reworded but faithful draft, which is exactly why the six-way
gradient and the human EXPERT_REVIEW_REQUIRED verdict exist. It uses no external
APIs, moves no value, and generates nothing; it only classifies the fidelity of
text it is given, and an AI round takes a few minutes to settle.
