export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x13cf5282cB0E19eD2279f2a05cFCc90FFa22F03F') as `0x${string}`;

export const NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'testnet-bradbury';

export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || 'https://explorer-bradbury.genlayer.com';

// Coarse, consensus-critical fidelity gate, ordered by severity.
export const GATE_VALUES = [
  'FAITHFUL',
  'FAITHFUL_WITH_CAVEATS',
  'NEEDS_REVISION',
  'OVERCLAIM_RISK',
  'MISLEADING',
  'EXPERT_REVIEW_REQUIRED',
] as const;

export const FAITHFUL_FAMILY = ['FAITHFUL', 'FAITHFUL_WITH_CAVEATS'];

export const DISTORTION_TYPES = [
  'MISSING_CAVEAT',
  'OVERCLAIM',
  'FALSE_ANALOGY',
  'UNSUPPORTED_CLAIM',
  'MEANING_LOSS',
  'SCOPE_EXPANSION',
  'SCOPE_NARROWING',
  'FALSE_CERTAINTY',
  'AUDIENCE_MISMATCH',
  'MISLEADING_SHORTCUT',
  'AMBIGUOUS_TERM',
  'RISKY_SIMPLIFICATION',
] as const;

export const SIMPLIFICATION_LEVELS = ['minimal', 'moderate', 'high', 'aggressive'] as const;

export const KNOWLEDGE_LEVELS = [
  'expert',
  'practitioner',
  'intermediate',
  'beginner',
  'general_public',
  'child',
] as const;

export const ANALOGY_PREFERENCES = ['none', 'light', 'welcome', 'required'] as const;
export const RISK_TOLERANCES = ['low', 'medium', 'high'] as const;
export const CAVEAT_REQUIREMENTS = ['all', 'key_only', 'minimal', 'none'] as const;
export const TONES = ['formal', 'neutral', 'friendly', 'playful'] as const;

export const TX_STATUS: Record<number, string> = {
  1: 'PENDING',
  2: 'PROPOSING',
  3: 'COMMITTING',
  4: 'REVEALING',
  5: 'ACCEPTED',
  6: 'UNDETERMINED',
  7: 'FINALIZED',
  8: 'CANCELED',
  12: 'VALIDATORS_TIMEOUT',
  13: 'LEADER_TIMEOUT',
};

export const VALIDATOR_LABELS: Record<string, string> = {
  essential_claim_coverage: 'Essential Claim Coverage',
  caveat_retention: 'Caveat Retention',
  overclaim_boundary: 'Overclaim Boundary',
  analogy_safety: 'Analogy Safety',
  audience_fit: 'Audience Fit',
  supported_claim: 'Supported Claim',
  false_certainty: 'False Certainty',
  evidence_consistency: 'Evidence Consistency',
};

export const DISTORTION_LABELS: Record<string, string> = {
  MISSING_CAVEAT: 'Missing caveat',
  OVERCLAIM: 'Overclaim',
  FALSE_ANALOGY: 'False analogy',
  UNSUPPORTED_CLAIM: 'Unsupported claim',
  MEANING_LOSS: 'Meaning loss',
  SCOPE_EXPANSION: 'Scope expansion',
  SCOPE_NARROWING: 'Scope narrowing',
  FALSE_CERTAINTY: 'False certainty',
  AUDIENCE_MISMATCH: 'Audience mismatch',
  MISLEADING_SHORTCUT: 'Misleading shortcut',
  AMBIGUOUS_TERM: 'Ambiguous term',
  RISKY_SIMPLIFICATION: 'Risky simplification',
};

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}

