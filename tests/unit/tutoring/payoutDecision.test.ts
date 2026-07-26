import { describe, it, expect } from "vitest";
import { computePayoutStatus } from "@/lib/tutoring/payoutDecision";

describe("computePayoutStatus", () => {
  it("is not eligible when there is no verifiable evaluation, even with a perfect score input", () => {
    expect(computePayoutStatus(1, 0.8, 0)).toBe("NOT_ELIGIBLE");
  });

  it("is eligible when the average achieved score meets the target", () => {
    expect(computePayoutStatus(0.85, 0.8, 3)).toBe("ELIGIBLE");
  });

  it("is eligible exactly at the target threshold", () => {
    expect(computePayoutStatus(0.8, 0.8, 1)).toBe("ELIGIBLE");
  });

  it("is not eligible when the average falls short, even by a little", () => {
    expect(computePayoutStatus(0.79, 0.8, 5)).toBe("NOT_ELIGIBLE");
  });

  it("bases the decision on the average across the whole period, not a single attempt", () => {
    // Un seul mauvais résultat noyé dans plusieurs bons ne suffit pas à faire échouer
    // l'objectif si la moyenne reste au-dessus du seuil.
    const scores = [0.9, 0.95, 0.3, 0.85];
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(computePayoutStatus(average, 0.7, scores.length)).toBe("ELIGIBLE");
  });
});
