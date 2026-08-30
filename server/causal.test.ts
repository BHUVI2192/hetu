import { describe, expect, it } from "vitest";
import {
  calculateCiaScore,
  calculateEvidenceScore,
  confidenceFromCiaScore,
  evidenceRawScore,
} from "../client/src/lib/causal";

describe("causal intelligence scoring", () => {
  it("weights observable evidence more than inferred evidence", () => {
    const raw = evidenceRawScore([
      { severity: "critical", category: "observable" },
      { severity: "high", category: "inferred" },
    ]);
    expect(raw).toBe(34);
    expect(calculateEvidenceScore(raw)).toBe(53);
  });

  it("caps evidence score at 100 and handles empty input", () => {
    expect(calculateEvidenceScore(0)).toBe(0);
    expect(calculateEvidenceScore(-4)).toBe(0);
    expect(calculateEvidenceScore(10000)).toBe(100);
  });

  it("implements the CIA weighting formula", () => {
    const score = calculateCiaScore({
      severity: 0.9,
      counterfactualResolution: 0.8,
      impactRatio: 0.6,
      earliness: 0.75,
    });
    expect(score).toBeCloseTo(0.78, 5);
    expect(confidenceFromCiaScore(score)).toBeCloseTo(0.975, 5);
  });

  it("caps confidence at 98 percent", () => {
    expect(confidenceFromCiaScore(1)).toBe(0.98);
  });
});
