export type EvidenceSeverity = "critical" | "high" | "medium" | "low";

export const SEVERITY_WEIGHTS: Record<EvidenceSeverity, number> = {
  critical: 25,
  high: 18,
  medium: 10,
  low: 5,
};

export function calculateEvidenceScore(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.round(Math.min(100, (raw * 100) / (raw + 30)));
}

export function evidenceRawScore(
  evidence: Array<{ severity: EvidenceSeverity; category: "observable" | "inferred" }>,
): number {
  return evidence.reduce((total, item) => {
    const categoryWeight = item.category === "observable" ? 1 : 0.5;
    return total + SEVERITY_WEIGHTS[item.severity] * categoryWeight;
  }, 0);
}

export function calculateCiaScore(input: {
  severity: number;
  counterfactualResolution: number;
  impactRatio: number;
  earliness: number;
}): number {
  return (
    input.severity * 0.3 +
    input.counterfactualResolution * 0.3 +
    input.impactRatio * 0.2 +
    input.earliness * 0.2
  );
}

export function confidenceFromCiaScore(score: number): number {
  return Math.min(score * 1.25, 0.98);
}
