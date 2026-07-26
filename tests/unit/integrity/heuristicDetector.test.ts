import { describe, it, expect } from "vitest";
import { heuristicDetector } from "@/lib/integrity/aiTextDetector/heuristicDetector";

describe("heuristicDetector", () => {
  it("scores a typical child's casual, quickly-typed answer as low suspicion", async () => {
    const result = await heuristicDetector.detect({
      text: "je pense que sais pas trop mais peut etre 12",
      childAgeYears: 9,
      timeTakenMs: 8000,
      exercisePromptLength: 40,
    });
    expect(result.suspicionScore).toBeLessThan(30);
  });

  it("scores a formal, perfectly-punctuated, fast AI-style answer as high suspicion", async () => {
    const text =
      "En conclusion, il est important de noter que ce problème mathématique nécessite une analyse rigoureuse. Par conséquent, la réponse appropriée est vingt-quatre.";
    const result = await heuristicDetector.detect({
      text,
      childAgeYears: 9,
      timeTakenMs: 2000,
      exercisePromptLength: 40,
    });
    expect(result.suspicionScore).toBeGreaterThan(60);
  });

  it("weighs vocabulary complexity against the child's own writing baseline", async () => {
    const text = "Cette question demande une réflexion approfondie et systématique.";
    const withoutBaseline = await heuristicDetector.detect({
      text,
      childAgeYears: 10,
      timeTakenMs: 15000,
      exercisePromptLength: 40,
    });
    const withMatchingBaseline = await heuristicDetector.detect({
      text,
      childAgeYears: 10,
      timeTakenMs: 15000,
      exercisePromptLength: 40,
      writingProfile: { avgWordLength: 7, avgSentenceLength: 10, commonErrorRate: 0.02 },
    });
    expect(withMatchingBaseline.suspicionScore).toBeLessThan(withoutBaseline.suspicionScore);
  });

  it("never returns a score outside [0, 100]", async () => {
    const result = await heuristicDetector.detect({
      text: "a".repeat(500),
      childAgeYears: 8,
      timeTakenMs: 1,
      exercisePromptLength: 10,
    });
    expect(result.suspicionScore).toBeGreaterThanOrEqual(0);
    expect(result.suspicionScore).toBeLessThanOrEqual(100);
  });
});
