import { describe, it, expect } from "vitest";
import { pickDailyRecommendation, type SkillCandidate } from "@/lib/progression/recommendation";

function candidate(overrides: Partial<SkillCandidate> & { skillId: string; order: number }): SkillCandidate {
  return {
    masteryScore: 0,
    attemptsCount: 0,
    readyForEvaluation: false,
    ...overrides,
  };
}

describe("pickDailyRecommendation", () => {
  it("returns null when there are no candidate skills", () => {
    expect(pickDailyRecommendation([])).toBeNull();
  });

  it("recommends the first skill in curriculum order when nothing has been attempted", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "b", order: 2 }),
      candidate({ skillId: "a", order: 1 }),
    ]);
    expect(result).toEqual({ skillId: "a", reason: "Découvre une nouvelle compétence aujourd'hui." });
  });

  it("prefers an in-progress skill closest to its mastery threshold over an untouched one", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "untouched", order: 1 }),
      candidate({ skillId: "close", order: 2, masteryScore: 0.8, attemptsCount: 12 }),
      candidate({ skillId: "far", order: 3, masteryScore: 0.3, attemptsCount: 5 }),
    ]);
    expect(result?.skillId).toBe("close");
  });

  it("recommends a skill ready for evaluation when nothing is still in progress", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "ready-later", order: 5, attemptsCount: 15, readyForEvaluation: true }),
      candidate({ skillId: "ready-first", order: 2, attemptsCount: 15, readyForEvaluation: true }),
    ]);
    expect(result).toEqual({
      skillId: "ready-first",
      reason: "Tu es prêt·e pour l'évaluation de cette compétence !",
    });
  });

  it("never recommends a skill that is already ready for evaluation over one still in progress", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "ready", order: 1, attemptsCount: 15, readyForEvaluation: true }),
      candidate({ skillId: "in-progress", order: 2, masteryScore: 0.5, attemptsCount: 8 }),
    ]);
    expect(result?.skillId).toBe("in-progress");
  });

  it("uses gradeMatch only as a tiebreaker when mastery scores are exactly equal", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "no-match", order: 1, masteryScore: 0.5, attemptsCount: 8 }),
      candidate({ skillId: "match", order: 2, masteryScore: 0.5, attemptsCount: 8, gradeMatch: true }),
    ]);
    expect(result?.skillId).toBe("match");
  });

  it("ignores gradeMatch when mastery scores differ (primary signal always wins)", () => {
    const result = pickDailyRecommendation([
      candidate({ skillId: "higher-mastery", order: 1, masteryScore: 0.8, attemptsCount: 12 }),
      candidate({
        skillId: "grade-match-but-lower-mastery",
        order: 2,
        masteryScore: 0.3,
        attemptsCount: 5,
        gradeMatch: true,
      }),
    ]);
    expect(result?.skillId).toBe("higher-mastery");
  });
});
