from conftest import CONTRACT, seed_concept, seed_lens


def test_create_concept_and_read_back(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    k = c.get_concept("concept_vax")
    assert k["title"] == "How mRNA vaccines work"
    assert k["domain"] == "immunology"
    assert len(k["essentialClaims"]) == 4
    assert len(k["requiredCaveats"]) == 2
    assert k["allowedSimplificationLevel"] == "high"


def test_duplicate_concept_rejected(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    with direct_vm.expect_revert("already exists"):
        seed_concept(c, direct_vm, direct_alice)


def test_lens_requires_concept(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("concept not found"):
        seed_lens(c, direct_vm, direct_alice)


def test_create_lens_and_counts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    seed_lens(c, direct_vm, direct_alice)
    lens_page = c.get_lenses_for_concept("concept_vax", 0, 20)
    assert lens_page["total"] == 1
    assert lens_page["items"][0]["audienceName"] == "Curious teenagers"
    assert lens_page["items"][0]["knowledgeLevel"] == "beginner"
    assert c.get_concept("concept_vax")["lensCount"] == 1


def test_draft_requires_matching_lens(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    seed_concept(c, direct_vm, direct_alice, concept_id="concept_two")
    seed_lens(c, direct_vm, direct_alice, concept_id="concept_two", lens_id="lens_two")
    direct_vm.sender = direct_alice
    # lens_two belongs to concept_two, not concept_vax
    with direct_vm.expect_revert("lens does not belong to concept"):
        c.submit_explanation_draft(
            "draft_mismatch", "concept_vax", "lens_two",
            "Some simplified text about the spike protein.", "", [], [], "usage",
        )


def test_submit_draft_and_counts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    seed_lens(c, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    c.submit_explanation_draft(
        "draft_a", "concept_vax", "lens_teen",
        "An mRNA vaccine gives instructions to build a harmless spike protein.",
        "", ["protection is not absolute"], [], "blog post",
    )
    d = c.get_draft("draft_a")
    assert d["evaluated"] is False
    assert d["status"] == "pending"
    assert c.get_concept("concept_vax")["draftCount"] == 1


def test_pagination(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    seed_concept(c, direct_vm, direct_alice, concept_id="concept_b")
    seed_concept(c, direct_vm, direct_alice, concept_id="concept_c")
    page = c.get_concepts_page(0, 2)
    assert page["total"] == 3
    assert page["limit"] == 2
    assert len(page["items"]) == 2
    page2 = c.get_concepts_page(2, 2)
    assert len(page2["items"]) == 1


def test_page_limit_capped_at_20(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    seed_concept(c, direct_vm, direct_alice)
    page = c.get_concepts_page(0, 999)
    assert page["limit"] == 20


def test_summary_initial(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    s = c.get_summary()
    assert s["concepts"] == 0
    assert s["lenses"] == 0
    assert s["drafts"] == 0
    assert len(s["gateValues"]) == 6
    assert len(s["distortionTypes"]) == 12


def test_missing_concept_reverts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT)
    with direct_vm.expect_revert("Concept not found"):
        c.get_concept("nope")
