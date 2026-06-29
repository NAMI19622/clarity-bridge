"""Deploy ClarityBridge to Bradbury testnet and seed the demo kernel.

Reads the deployer private key from the workspace .env (GENLAYER_PRIVATE_KEY).
Usage:
    python scripts/deploy.py            # deploy + seed
    python scripts/deploy.py --no-seed  # deploy only
"""
import os
import sys
import json
import re

from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)
CONTRACT_PATH = os.path.join(ROOT, "contracts", "contract.py")


def load_key() -> str:
    # Prefer environment, then workspace .env, then project .env.
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    for env_path in (os.path.join(WORKSPACE, ".env"), os.path.join(ROOT, ".env")):
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as fh:
                for line in fh:
                    m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
                    if m:
                        return m.group(1).strip()
    raise SystemExit("GENLAYER_PRIVATE_KEY not found in env or .env")


def main():
    seed = "--no-seed" not in sys.argv
    key = load_key()
    account = create_account(account_private_key=key)
    client = create_client(chain=testnet_bradbury, account=account)
    print("Deployer:", account.address)

    with open(CONTRACT_PATH, "r", encoding="utf-8") as fh:
        code = fh.read()

    print("Deploying ClarityBridge ...")
    tx_hash = client.deploy_contract(code=code, args=[])
    print("Deploy tx:", tx_hash)
    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash, status="ACCEPTED", retries=80, interval=5000
    )
    address = receipt.get("data", {}).get("contract_address") or receipt.get("contract_address")
    if not address:
        address = _find_address(receipt)
    print("Contract address:", address)

    out = {"contract": address, "deployTx": tx_hash, "network": "testnet-bradbury"}
    with open(os.path.join(ROOT, "deployment.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2)
    print("Wrote deployment.json")

    if seed and address:
        seed_demo(client, account, address)


def _find_address(receipt):
    stack = [receipt]
    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            for k, v in cur.items():
                if k in ("contract_address", "contractAddress") and isinstance(v, str):
                    return v
                stack.append(v)
        elif isinstance(cur, list):
            stack.extend(cur)
    return None


def _write(client, address, method, args):
    print("  write:", method)
    tx = client.write_contract(address=address, function_name=method, args=args)
    client.wait_for_transaction_receipt(transaction_hash=tx, status="ACCEPTED", retries=80, interval=5000)
    return tx


# ---- Mandatory demo content: the GenLayer Intelligent Contracts concept ----

DEMO_CONCEPT_ID = "concept_genlayer"
DEMO_LENS_ID = "lens_newcomer"
DEMO_BAD_DRAFT_ID = "draft_genlayer_bad"
DEMO_GOOD_DRAFT_ID = "draft_genlayer_good"

DEMO_ORIGINAL = (
    "A GenLayer Intelligent Contract is a smart contract that can run AI models as "
    "part of its logic. Because AI outputs are nondeterministic, GenLayer reaches "
    "agreement through Optimistic Democracy: a leader proposes a result and other "
    "validators independently re-run the work and vote on whether to accept it. The "
    "contract stays deterministic at the boundary by comparing structured outputs "
    "within tolerances, so the AI judgment is constrained, not trusted blindly."
)
DEMO_ESSENTIAL = [
    "an intelligent contract can call an AI model as part of its on-chain logic",
    "AI outputs are nondeterministic so plain re-execution would not agree",
    "validators independently re-run the work and vote to reach consensus",
    "the contract compares structured outputs within tolerances to stay deterministic",
]
DEMO_CAVEATS = [
    "the AI judgment is constrained by validators, not trusted blindly",
    "consensus on an AI result can take longer than an ordinary transaction",
]
DEMO_OVERCLAIMS = [
    "the contract is a fully autonomous AI that decides on its own",
    "results are always correct and never need review",
    "GenLayer removes the need for any validators",
]
DEMO_DEFINITIONS = [
    "validator: a node that independently re-runs and votes on a proposed result",
    "Optimistic Democracy: leader proposes, validators verify and vote",
]
DEMO_MISCONCEPTIONS = [
    "the contract is just one AI making final decisions alone",
    "AI results are accepted without any independent checking",
]

# A bad draft: drops the consensus caveat and overstates autonomy.
DEMO_BAD_TEXT = (
    "A GenLayer Intelligent Contract is a fully autonomous AI that lives on the "
    "blockchain and decides everything on its own. It always gets the right answer "
    "instantly, so you never have to check it."
)
# A better draft: keeps the essential claims and the caveats, no overclaim.
DEMO_GOOD_TEXT = (
    "A GenLayer Intelligent Contract is a smart contract that can ask an AI model "
    "for help inside its own logic. Because AI answers are not identical every time, "
    "GenLayer does not just trust one answer. A leader proposes a result, and other "
    "validators redo the work and vote on whether to accept it. The contract only "
    "compares the structured parts of the answer within set limits, so it stays "
    "predictable. The AI judgment is checked by validators rather than trusted "
    "blindly, and reaching agreement on an AI result can take longer than a normal "
    "transaction."
)
DEMO_GOOD_CAVEATS = [
    "the AI judgment is checked by validators rather than trusted blindly",
    "reaching agreement on an AI result can take longer than a normal transaction",
]


def seed_demo(client, account, address):
    print("Seeding the GenLayer Intelligent Contracts demo kernel ...")
    _write(client, address, "create_concept_kernel", [
        DEMO_CONCEPT_ID,
        "GenLayer Intelligent Contracts",
        "blockchain",
        DEMO_ORIGINAL,
        DEMO_ESSENTIAL,
        DEMO_CAVEATS,
        DEMO_OVERCLAIMS,
        DEMO_DEFINITIONS,
        DEMO_MISCONCEPTIONS,
        "high",
    ])
    _write(client, address, "create_audience_lens", [
        DEMO_LENS_ID,
        DEMO_CONCEPT_ID,
        "Curious newcomers to blockchain",
        "beginner",
        ["smart contract", "AI model", "vote"],
        "welcome",
        "low",
        "key_only",
        "friendly",
    ])
    _write(client, address, "submit_explanation_draft", [
        DEMO_BAD_DRAFT_ID, DEMO_CONCEPT_ID, DEMO_LENS_ID,
        DEMO_BAD_TEXT,
        "It is like a robot that is fully autonomous and thinks for itself.",
        [],
        ["it always gets the right answer instantly"],
        "intro blog post",
    ])
    _write(client, address, "submit_explanation_draft", [
        DEMO_GOOD_DRAFT_ID, DEMO_CONCEPT_ID, DEMO_LENS_ID,
        DEMO_GOOD_TEXT,
        "It is like asking a panel of reviewers to redo and vote on one expert's answer.",
        DEMO_GOOD_CAVEATS,
        [],
        "intro blog post",
    ])
    print("Seed complete. Two drafts are ready to evaluate from the UI:")
    print("  - " + DEMO_BAD_DRAFT_ID + " (expected to need revision / overclaim)")
    print("  - " + DEMO_GOOD_DRAFT_ID + " (expected to be faithful with caveats)")


if __name__ == "__main__":
    main()
