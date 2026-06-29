export interface Summary {
  concepts: number;
  lenses: number;
  drafts: number;
  certificates: number;
  faithful: number;
  needingRevision: number;
  gateValues: string[];
  distortionTypes: string[];
  contractOwner: string;
}

export interface ConceptKernel {
  id: string;
  owner: string;
  title: string;
  domain: string;
  originalExplanation: string;
  essentialClaims: string[];
  requiredCaveats: string[];
  forbiddenOverclaims: string[];
  keyDefinitions: string[];
  knownMisconceptions: string[];
  allowedSimplificationLevel: string;
  lensCount: number;
  draftCount: number;
  seq: number;
}

export interface AudienceLens {
  id: string;
  conceptId: string;
  owner: string;
  audienceName: string;
  knowledgeLevel: string;
  allowedVocabulary: string[];
  analogyPreference: string;
  riskTolerance: string;
  caveatRequirement: string;
  tone: string;
  seq: number;
}

export interface ExplanationDraft {
  id: string;
  conceptId: string;
  lensId: string;
  owner: string;
  simplifiedExplanation: string;
  analogyUsed: string;
  caveatsIncluded: string[];
  claimsMade: string[];
  intendedUsage: string;
  evaluated: boolean;
  gateResult: string;
  status: string;
  seq: number;
}

export interface ValidatorResult {
  validator: string;
  passed: boolean;
  reason: string;
  blocks: boolean;
}

export interface Evaluation {
  id: string;
  draftId: string;
  conceptId: string;
  lensId: string;
  gate: string;
  rawGate: string;
  fidelityBps: number;
  clarityBps: number;
  caveatRetentionBps: number;
  matchedEssentialClaims: string[];
  missingEssentialClaims: string[];
  missingCaveats: string[];
  overclaimFlags: string[];
  analogyRisks: string[];
  distortionTypes: string[];
  requiredRevisions: string[];
  confidenceBps: number;
  validatorSummary: ValidatorResult[];
  reason: string;
  proofHash: string;
  seq: number;
}

export interface ClarityCertificate {
  id: string;
  draftId: string;
  conceptId: string;
  lensId: string;
  gate: string;
  fidelityBps: number;
  caveatRetentionBps: number;
  distortionTypes: string[];
  audienceName: string;
  proofHash: string;
  status: string;
  seq: number;
}

export interface Page<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}
