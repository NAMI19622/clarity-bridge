"""Seed the mandatory demo kernel, lens, and the bad/better drafts onto a
deployed ClarityBridge contract. Idempotent: skips anything already present."""
import os, re, json
from genlayer_py import create_client, create_account
from genlayer_py.chains import testnet_bradbury

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKSPACE = os.path.dirname(ROOT)


def load_key():
    key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if key:
        return key.strip().strip('"')
    with open(os.path.join(WORKSPACE, ".env"), "r", encoding="utf-8") as fh:
        for line in fh:
            m = re.match(r'\s*GENLAYER_PRIVATE_KEY\s*=\s*"?([^"\r\n]+)"?', line)
            if m:
                return m.group(1).strip()


with open(os.path.join(ROOT, "deployment.json")) as fh:
    ADDRESS = json.load(fh)["contract"]

acct = create_account(account_private_key=load_key())
client = create_client(chain=testnet_bradbury, account=acct)


def w(method, args):
    print("write:", method)
    tx = client.write_contract(address=ADDRESS, function_name=method, args=args)
    client.wait_for_transaction_receipt(transaction_hash=tx, status="ACCEPTED", retries=90, interval=5000)
    print("  accepted:", tx)


def has(view, arg):
    try:
        client.read_contract(address=ADDRESS, function_name=view, args=[arg])
        return True
    except Exception:
        return False


CONCEPT_ID = "concept_genlayer"
LENS_ID = "lens_newcomer"
BAD_ID = "draft_genlayer_bad"
GOOD_ID = "draft_genlayer_good"

ORIGINAL = (
    "A GenLayer Intelligent Contract is a smart contract that can run AI models as "
    "part of its logic. Because AI outputs are nondeterministic, GenLayer reaches "
    "agreement through Optimistic Democracy: a leader proposes a result and other "
    "validators independently re-run the work and vote on whether to accept it. The "
    "contract stays deterministic at the boundary by comparing structured outputs "
    "within tolerances, so the AI judgment is constrained, not trusted blindly."
)
ESSENTIAL = [
    "an intelligent contract can call an AI model as part of its on-chain logic",
    "AI outputs are nondeterministic so plain re-execution would not agree",
    "validators independently re-run the work and vote to reach consensus",
    "the contract compares structured outputs within tolerances to stay deterministic",
]
CAVEATS = [
    "the AI judgment is constrained by validators, not trusted blindly",
    "consensus on an AI result can take longer than an ordinary transaction",
]
OVERCLAIMS = [
    "the contract is a fully autonomous AI that decides on its own",
    "results are always correct and never need review",
    "GenLayer removes the need for any validators",
]
DEFINITIONS = [
    "validator: a node that independently re-runs and votes on a proposed result",
    "Optimistic Democracy: leader proposes, validators verify and vote",
]
MISCONCEPTIONS = [
    "the contract is just one AI making final decisions alone",
    "AI results are accepted without any independent checking",
]
BAD_TEXT = (
    "A GenLayer Intelligent Contract is a fully autonomous AI that lives on the "
    "blockchain and decides everything on its own. It always gets the right answer "
    "instantly, so you never have to check it."
)
GOOD_TEXT = (
    "A GenLayer Intelligent Contract is a smart contract that can ask an AI model "
    "for help inside its own logic. Because AI answers are not identical every time, "
    "GenLayer does not just trust one answer. A leader proposes a result, and other "
    "validators redo the work and vote on whether to accept it. The contract only "
    "compares the structured parts of the answer within set limits, so it stays "
    "predictable. The AI judgment is checked by validators rather than trusted "
    "blindly, and reaching agreement on an AI result can take longer than a normal "
    "transaction."
)
GOOD_CAVEATS = [
    "the AI judgment is checked by validators rather than trusted blindly",
    "reaching agreement on an AI result can take longer than a normal transaction",
]


if not has("get_concept", CONCEPT_ID):
    w("create_concept_kernel", [
        CONCEPT_ID, "GenLayer Intelligent Contracts", "blockchain",
        ORIGINAL, ESSENTIAL, CAVEATS, OVERCLAIMS, DEFINITIONS, MISCONCEPTIONS, "high",
    ])

if not has("get_draft", BAD_ID) and not has("get_draft", GOOD_ID):
    w("create_audience_lens", [
        LENS_ID, CONCEPT_ID, "Curious newcomers to blockchain", "beginner",
        ["smart contract", "AI model", "vote"], "welcome", "low", "key_only", "friendly",
    ])

if not has("get_draft", BAD_ID):
    w("submit_explanation_draft", [
        BAD_ID, CONCEPT_ID, LENS_ID, BAD_TEXT,
        "It is like a robot that is fully autonomous and thinks for itself.",
        [], ["it always gets the right answer instantly"], "intro blog post",
    ])

if not has("get_draft", GOOD_ID):
    w("submit_explanation_draft", [
        GOOD_ID, CONCEPT_ID, LENS_ID, GOOD_TEXT,
        "It is like asking a panel of reviewers to redo and vote on one expert's answer.",
        GOOD_CAVEATS, [], "intro blog post",
    ])

print("Seed complete.")
print(json.dumps(client.read_contract(address=ADDRESS, function_name="get_summary", args=[]), default=str))
