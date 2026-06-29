from conftest import CONTRACT, seed_concept, seed_lens, mock_eval


# A draft that keeps every essential claim, both caveats, no overclaim, fits a
# beginner audience, and uses a safe analogy.
FAITHFUL_TEXT = (
    "An mRNA vaccine gives your cells instructions to build a harmless spike "
    "protein. Your immune system then learns to recognize that spike protein so "
    "it can respond faster. The mRNA does not change your DNA, and it breaks "
    "down within a few days. Protection is not absolute, so breakthrough "
    "infections can still happen, and side effects such as a sore arm or short "
    "fever are possible."
)

CAVEATS_IN_DRAFT = [
    "protection is not absolute and breakthrough infections can still happen",
    "side effects such as a sore arm or short fever are possible",
]


def _submit(c, vm, owner, did, simplified, analogy="", caveats=None, claims=None,
            concept_id="concept_vax", lens_id="lens_teen"):
    vm.sender = owner
    c.submit_explanation_draft(
        did,
        concept_id,
        lens_id,
        simplified,
        analogy,
        caveats or [],
        claims or [],
        "share on a school science blog",
    )


def _setup(direct_vm, direct_deploy, direct_alice, knowledge_level="beginner"):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    seed_lens(c, direct_vm, direct_alice, knowledge_level=knowledge_level)
    return c


# Scenario 1: a faithful simplification settles to FAITHFUL_WITH_CAVEATS.
def test_faithful_simplification(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _submit(c, direct_vm, direct_alice, "draft_ok", FAITHFUL_TEXT,
            caveats=CAVEATS_IN_DRAFT)
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3], fidelity=9200,
              caveat_retention=9000)
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_ok")
    d = c.get_draft("draft_ok")
    assert d["gateResult"] == "FAITHFUL_WITH_CAVEATS"
    assert d["status"] == "faithful_with_caveats"
    ev = c.get_evaluation("draft_ok")
    assert ev["proofHash"].startswith("0xCB")
    assert ev["missingEssentialClaims"] == []


# Scenario 2: a dropped required caveat forces NEEDS_REVISION.
def test_missing_caveat(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    text = (
        "An mRNA vaccine gives instructions to build a harmless spike protein. "
        "Your immune system learns to recognize that spike protein. The mRNA does "
        "not change your DNA and breaks down within days."
    )
    _submit(c, direct_vm, direct_alice, "draft_nocaveat", text)
    # Model is over-optimistic and says faithful; the backstop must override.
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_nocaveat")
    d = c.get_draft("draft_nocaveat")
    assert d["gateResult"] == "NEEDS_REVISION"
    ev = c.get_evaluation("draft_nocaveat")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["caveat_retention"]["passed"] is False
    assert "MISSING_CAVEAT" in ev["distortionTypes"]


# Scenario 3: a forbidden overclaim phrase forces OVERCLAIM_RISK.
def test_overclaim_risk(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    text = (
        "An mRNA vaccine gives instructions to build a harmless spike protein, and "
        "your immune system learns to recognize that spike protein. The mRNA does "
        "not change your DNA and breaks down within days. It guarantees you will "
        "never get infected."
    )
    _submit(c, direct_vm, direct_alice, "draft_over", text, caveats=CAVEATS_IN_DRAFT)
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_over")
    d = c.get_draft("draft_over")
    assert d["gateResult"] == "OVERCLAIM_RISK"
    ev = c.get_evaluation("draft_over")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["overclaim_boundary"]["passed"] is False
    assert "OVERCLAIM" in ev["distortionTypes"]


# Scenario 4: an analogy that overstates autonomy forces MISLEADING.
def test_false_analogy(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    analogy = (
        "The vaccine is like a tiny sentient robot that is fully autonomous and "
        "thinks for itself inside your body."
    )
    _submit(c, direct_vm, direct_alice, "draft_analogy", FAITHFUL_TEXT,
            analogy=analogy, caveats=CAVEATS_IN_DRAFT)
    mock_eval(direct_vm, "FAITHFUL_WITH_CAVEATS", matched=[0, 1, 2, 3])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_analogy")
    d = c.get_draft("draft_analogy")
    assert d["gateResult"] == "MISLEADING"
    ev = c.get_evaluation("draft_analogy")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["analogy_safety"]["passed"] is False
    assert "FALSE_ANALOGY" in ev["distortionTypes"]


# Scenario 5: dense jargon for a beginner lens forces NEEDS_REVISION.
def test_audience_mismatch(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    text = (
        "The immunomodulatory oligonucleotide drives transcriptional "
        "reprogramming of antigen-presenting lymphocytes."
    )
    _submit(c, direct_vm, direct_alice, "draft_jargon", text)
    mock_eval(direct_vm, "FAITHFUL")
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_jargon")
    d = c.get_draft("draft_jargon")
    assert d["gateResult"] == "NEEDS_REVISION"
    ev = c.get_evaluation("draft_jargon")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["audience_fit"]["passed"] is False
    assert "AUDIENCE_MISMATCH" in ev["distortionTypes"]


# Scenario 6: a claim not grounded in the kernel flags UNSUPPORTED_CLAIM.
def test_invented_claim(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _submit(c, direct_vm, direct_alice, "draft_invent", FAITHFUL_TEXT,
            caveats=CAVEATS_IN_DRAFT,
            claims=["the vaccine also cures cancer permanently"])
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_invent")
    d = c.get_draft("draft_invent")
    assert d["gateResult"] == "NEEDS_REVISION"
    ev = c.get_evaluation("draft_invent")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["supported_claim"]["passed"] is False
    assert "UNSUPPORTED_CLAIM" in ev["distortionTypes"]


# Scenario 7: a fake "missing caveat" finding is dropped by evidence consistency.
def test_fake_evaluation_evidence(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _submit(c, direct_vm, direct_alice, "draft_fake", FAITHFUL_TEXT,
            caveats=CAVEATS_IN_DRAFT)
    # The model invents a missing caveat that the draft clearly includes.
    mock_eval(direct_vm, "FAITHFUL_WITH_CAVEATS", matched=[0, 1, 2, 3],
              missing_caveats=[0])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_fake")
    ev = c.get_evaluation("draft_fake")
    summary = {v["validator"]: v for v in ev["validatorSummary"]}
    assert summary["evidence_consistency"]["passed"] is False
    # The bogus finding is dropped from the recorded evidence.
    assert ev["missingCaveats"] == []
    d = c.get_draft("draft_fake")
    assert d["gateResult"] == "FAITHFUL_WITH_CAVEATS"


# Scenario 8: a faithful draft can be sealed into a clarity certificate.
def test_certificate_ready(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _submit(c, direct_vm, direct_alice, "draft_cert", FAITHFUL_TEXT,
            caveats=CAVEATS_IN_DRAFT)
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3], fidelity=9100)
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_cert")
    c.create_clarity_certificate("cert_1", "draft_cert")
    cert = c.get_certificate_for_draft("draft_cert")
    assert cert["status"] == "sealed"
    assert cert["gate"] == "FAITHFUL_WITH_CAVEATS"
    assert cert["audienceName"] == "Curious teenagers"
    assert cert["proofHash"].startswith("0xCB")
    summary = c.get_summary()
    assert summary["certificates"] == 1


# A non-certifiable draft cannot be sealed.
def test_certificate_rejected_when_not_faithful(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    text = (
        "An mRNA vaccine gives instructions to build a harmless spike protein. "
        "Your immune system learns to recognize that spike protein. The mRNA does "
        "not change your DNA and breaks down within days."
    )
    _submit(c, direct_vm, direct_alice, "draft_bad", text)
    mock_eval(direct_vm, "FAITHFUL")
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_bad")
    with direct_vm.expect_revert("not certifiable"):
        c.create_clarity_certificate("cert_bad", "draft_bad")


def test_double_evaluation_rejected(direct_vm, direct_deploy, direct_alice):
    c = _setup(direct_vm, direct_deploy, direct_alice)
    _submit(c, direct_vm, direct_alice, "draft_dbl", FAITHFUL_TEXT,
            caveats=CAVEATS_IN_DRAFT)
    mock_eval(direct_vm, "FAITHFUL", matched=[0, 1, 2, 3])
    direct_vm.sender = direct_alice
    c.evaluate_explanation_fidelity("draft_dbl")
    with direct_vm.expect_revert("already evaluated"):
        c.evaluate_explanation_fidelity("draft_dbl")
