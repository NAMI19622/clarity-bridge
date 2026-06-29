# Frontend Design Contract

## screenArchitecture
split-pane-workspace. A knowledge observatory: left kernel and lens rail, center
bridge span with the original idea and the crossing composer, right fidelity
inspector. Not a landing page and not a submit-to-feed.

## aboveTheFold
On first load the user lands inside the observatory, not a marketing page. The
center shows the living MeaningBridge: two cores, the precise Concept Kernel on
the left and the simplified Draft on the right, joined by meaning strands that
stretch across a warped distortion field, read live from the contract in
read-only mode. The left rail lists concept kernels and the lenses of the active
kernel. The right rail shows the fidelity inspector waiting for a crossing. A
bottom transaction theater is idle.

## primaryInteraction
Select a kernel, pick an audience lens, compose a simplified explanation in the
center composer, and send it across the bridge. Submitting and evaluating are
real on-chain writes; while the gate deliberates, a meaning pulse travels from
the concept core toward the draft core along the central strand, the distortion
field bends by the verdict's drift, caveat anchors light or go adrift, validator
lenses focus in sequence, and a clarity certificate seal stamps on a faithful
crossing. This is not submit-text-then-feed: the draft is judged against a
persisted, owned kernel and settles into a six-way fidelity verdict.

## layoutMap
- Left rail: concept kernel list, audience lens list for the active kernel,
  add buttons, wallet.
- Center: MeaningBridge canvas on top, then the original idea panel, then the
  draft composer, then the list of crossings; during evaluation the bridge
  becomes the gate stage.
- Right rail: distortion field readout, the settled verdict card, the caveat
  anchor row, the validator lens rings, and the clarity certificate seal.
- Bottom: TransactionTheater staging PENDING to ACCEPTED with the tx hash.

## visualMetaphor
A semantic bridge across a knowledge observatory. A precise concept core and a
simplified draft core joined by meaning strands; the strands bow, fray, and
desaturate as fidelity falls and the distortion field warps. A faceted lens
medallion is stamped as a clarity certificate when meaning crosses intact.

## motionSystem
1. MeaningBridge canvas loop: two cores joined by meaning strands over a warped
   distortion grid, device-pixel-ratio aware, paused when the tab is hidden,
   disabled under prefers-reduced-motion.
2. Concept-kernel-forming entry sequence: panels and pills rise into place on
   first mount as the kernel anchors the bridge.
3. Pointer-reactive bridge: the strand field responds to cursor position over
   the canvas.
4. Gate lifecycle theater: on evaluate, a meaning pulse travels concept to draft
   along the central strand while the TransactionTheater advances PENDING to
   ACCEPTED and validator lenses focus in the right rail.
5. On-chain state update: the distortion field bends to the settled verdict, the
   caveat anchors light gold or go adrift red, and the clarity certificate seal
   stamps with a spring when a faithful crossing is sealed.

## effectStack
- Device-pixel-ratio aware canvas MeaningBridge with strand and distortion-field
  rendering.
- SVG DistortionField that bends a delivered-meaning line away from a straight
  original-meaning baseline by the verdict drift.
- Faceted lens-medallion CertificateSeal stamp animation on a faithful crossing.
- CaveatAnchorRow and ValidatorLensRing progressive reveal tied to the verdict.

## componentShapeLanguage
Strands, anchors, lens rings, and a faceted seal medallion. Two cores bridged by
strands, caveats as anchor diamonds on the deck, validators as focusing lens
rings, a certified crossing as an engraved lens seal. No generic cards as the
primary surface.

## customVisualComponents
1. MeaningBridge (canvas: two cores joined by meaning strands over a warped
   distortion field).
2. DistortionField (SVG: a delivered-meaning line bending from the original
   baseline by the verdict drift, with detected distortion tags).
3. CaveatAnchorRow (anchor diamonds that light gold when a caveat is retained,
   red when it drifts).
4. ValidatorLensRing (the eight fidelity validators as focusing lens rings).
5. CertificateSeal (a faceted lens medallion stamping the verdict, scores, and
   proof hash).
6. TransactionTheater (consensus lifecycle theater bound to tx status).

## bannedFromThisBuild
- No generic centered marketing hero.
- No equal feature cards.
- No horizontal stats strip under a hero.
- No chip row under a hero.
- No submit-form-to-feed main skeleton.
- No three-column footer.
- No emojis and no em dash.
- No reuse of the persona-seal concentric-membrane identity.

## proofOfDifference
Versus persona-seal (a consent atelier built on concentric persona membranes and
wax seals) ClarityBridge is a knowledge observatory built on a two-core meaning
bridge, strands, and a warping distortion field. The contract mechanic is a
kernel-to-draft fidelity crossing settled into a six-way meaning-preservation
gradient, distinct from persona-seal's persona-scoped consent gate. The palette
is deep ink and knowledge navy with clarity gold, bridge cyan, lens violet,
truth green, drift red, and revision blue, not persona-seal's boundary violet
and consent gold seal identity.
