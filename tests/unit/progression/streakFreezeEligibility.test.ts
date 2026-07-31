import { describe, expect, it } from "vitest";
import {
  checkStreakFreezeEligibility,
  MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE,
} from "@/lib/progression/streakFreezeEligibility";

describe("checkStreakFreezeEligibility", () => {
  it("refuse l'achat si un jour de repos non consommé est déjà en réserve", () => {
    const result = checkStreakFreezeEligibility({
      unconsumedStreakFreezeCount: 1,
      practiceExercisesSinceLastStreakFreeze: 100,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/déjà un jour de repos/);
  });

  it("refuse l'achat si pas assez d'exercices pratiqués depuis le dernier jour de repos", () => {
    const result = checkStreakFreezeEligibility({
      unconsumedStreakFreezeCount: 0,
      practiceExercisesSinceLastStreakFreeze: MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE - 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/Entraîne-toi encore/);
  });

  it("autorise l'achat sans jour de repos en réserve et avec assez de pratique", () => {
    const result = checkStreakFreezeEligibility({
      unconsumedStreakFreezeCount: 0,
      practiceExercisesSinceLastStreakFreeze: MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE,
    });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("autorise l'achat même pour un premier jour de repos jamais acheté (0 pratique requise franchie)", () => {
    const result = checkStreakFreezeEligibility({
      unconsumedStreakFreezeCount: 0,
      practiceExercisesSinceLastStreakFreeze: MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE + 5,
    });
    expect(result.eligible).toBe(true);
  });
});
