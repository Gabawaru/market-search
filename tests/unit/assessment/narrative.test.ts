import { describe, it, expect } from "vitest";
import { buildNarrative } from "@/lib/assessment/narrative";

describe("buildNarrative", () => {
  it("says plainly when there was no activity, without inventing anything positive", () => {
    const text = buildNarrative({
      childName: "Léo",
      objectiveScore: 0,
      effortScore: 0,
      exerciseCount: 0,
      evaluationCount: 0,
      passedCount: 0,
    });
    expect(text).toBe("Léo n'a pas encore pratiqué sur cette période.");
  });

  it("is honestly positive when results and effort are both strong", () => {
    const text = buildNarrative({
      childName: "Nina",
      objectiveScore: 0.95,
      effortScore: 0.9,
      exerciseCount: 40,
      evaluationCount: 2,
      passedCount: 2,
    });
    expect(text).toContain("excellents");
    expect(text).toContain("très régulier");
  });

  it("does not sugarcoat poor results even with good effort (no favoritism)", () => {
    const text = buildNarrative({
      childName: "Sami",
      objectiveScore: 0.4,
      effortScore: 0.9,
      exerciseCount: 30,
      evaluationCount: 1,
      passedCount: 0,
    });
    expect(text).toContain("difficultés");
    expect(text).toContain("très régulier");
  });

  it("flags irregular engagement even when results happen to be good", () => {
    const text = buildNarrative({
      childName: "Amine",
      objectiveScore: 0.95,
      effortScore: 0.2,
      exerciseCount: 5,
      evaluationCount: 0,
      passedCount: 0,
    });
    expect(text).toContain("excellents");
    expect(text).toContain("irrégulier");
  });
});
