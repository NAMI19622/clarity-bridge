import json
import os

# Windows workaround: the gltest direct loader maps a temp file onto stdin (fd 0)
# and then tries to unlink it while it is still open, which Windows forbids
# (WinError 32). Swallow that specific error so the in-memory test VM can run.
# This does not affect contract behavior; it only tolerates a leftover temp file.
_orig_unlink = os.unlink


def _safe_unlink(path, *args, **kwargs):
    try:
        return _orig_unlink(path, *args, **kwargs)
    except PermissionError:
        return None


os.unlink = _safe_unlink

CONTRACT = os.path.join("contracts", "contract.py")


def seed_concept(contract, vm, owner, concept_id="concept_vax"):
    vm.sender = owner
    contract.create_concept_kernel(
        concept_id,
        "How mRNA vaccines work",
        "immunology",
        (
            "An mRNA vaccine delivers instructions that tell some cells to build a "
            "harmless spike protein. The immune system learns to recognize that "
            "protein, so it may respond faster to the real virus later. The mRNA "
            "does not enter the cell nucleus and does not change your DNA, and the "
            "instructions break down within days."
        ),
        [
            "the vaccine delivers instructions to build a harmless spike protein",
            "the immune system learns to recognize the spike protein",
            "the mRNA does not change your DNA",
            "the mRNA breaks down within days",
        ],
        [
            "protection is not absolute and breakthrough infections can still happen",
            "side effects such as a sore arm or short fever are possible",
        ],
        [
            "guarantees you will never get infected",
            "alters your genetic code permanently",
        ],
        [
            "spike protein: a harmless piece the virus normally uses to enter cells",
            "mRNA: a short-lived instruction molecule",
        ],
        [
            "the vaccine contains a live virus",
            "the vaccine stays in your body forever",
        ],
        "high",
    )
    return concept_id


def seed_lens(contract, vm, owner, concept_id="concept_vax", lens_id="lens_teen",
              knowledge_level="beginner"):
    vm.sender = owner
    contract.create_audience_lens(
        lens_id,
        concept_id,
        "Curious teenagers",
        knowledge_level,
        ["protein", "immune system", "instructions"],
        "welcome",
        "low",
        "key_only",
        "friendly",
    )
    return lens_id


def mock_eval(vm, gate, matched=None, missing_essential=None, missing_caveats=None,
              overclaim=None, analogy=None, distortions=None, revisions=None,
              fidelity=8000, clarity=8000, caveat_retention=8000, confidence=90,
              reason="test"):
    payload = {
        "gate": gate,
        "matched_essential_claims": matched or [],
        "missing_essential_claims": missing_essential or [],
        "missing_caveats": missing_caveats or [],
        "overclaim_flags": overclaim or [],
        "analogy_risks": analogy or [],
        "distortion_types": distortions or [],
        "required_revisions": revisions or [],
        "fidelity_bps": fidelity,
        "clarity_bps": clarity,
        "caveat_retention_bps": caveat_retention,
        "confidence": confidence,
        "reason": reason,
    }
    vm.mock_llm(r".*ClarityBridge.*", json.dumps(payload))
