export function shortAddr(addr?: string | null): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function gateLabel(gate: string): string {
  return gate.replace(/_/g, ' ');
}

// Color of a fidelity verdict on the bridge palette.
export function gateColor(gate: string): string {
  switch (gate) {
    case 'FAITHFUL':
      return 'var(--truth)';
    case 'FAITHFUL_WITH_CAVEATS':
      return 'var(--cyan)';
    case 'NEEDS_REVISION':
      return 'var(--revision)';
    case 'OVERCLAIM_RISK':
      return 'var(--gold)';
    case 'MISLEADING':
      return 'var(--drift)';
    case 'EXPERT_REVIEW_REQUIRED':
      return 'var(--violet)';
    default:
      return 'var(--mist)';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'faithful':
    case 'faithful_with_caveats':
      return 'var(--truth)';
    case 'needs_revision':
      return 'var(--revision)';
    case 'overclaim_risk':
      return 'var(--gold)';
    case 'misleading':
      return 'var(--drift)';
    case 'expert_review':
      return 'var(--violet)';
    default:
      return 'var(--mist)';
  }
}

// How far a verdict bends the distortion field: 0 = straight, 1 = fully warped.
export function gateDrift(gate: string): number {
  switch (gate) {
    case 'FAITHFUL':
      return 0;
    case 'FAITHFUL_WITH_CAVEATS':
      return 0.12;
    case 'NEEDS_REVISION':
      return 0.45;
    case 'OVERCLAIM_RISK':
      return 0.62;
    case 'EXPERT_REVIEW_REQUIRED':
      return 0.7;
    case 'MISLEADING':
      return 0.92;
    default:
      return 0.3;
  }
}

export function bps(value: number): string {
  return (value / 100).toFixed(0) + '%';
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
