import { describe, it, expect } from "vitest";
import { isReadyForTeacherExercise } from "@/lib/progression/teacherExercises";

describe("isReadyForTeacherExercise", () => {
  it("grants access when points and level both meet the requirement", () => {
    expect(isReadyForTeacherExercise(50, 2, { pointsRequired: 30, level: { order: 2 } })).toBe(true);
  });

  it("denies access when points are insufficient, even at the right level", () => {
    expect(isReadyForTeacherExercise(10, 2, { pointsRequired: 30, level: { order: 2 } })).toBe(false);
  });

  it("denies access when the child hasn't reached the required level, even with enough points", () => {
    expect(isReadyForTeacherExercise(100, 1, { pointsRequired: 30, level: { order: 2 } })).toBe(false);
  });

  it("does not consume points — the check is a threshold, not a spend", () => {
    const exercise = { pointsRequired: 30, level: { order: 1 } };
    const before = isReadyForTeacherExercise(30, 1, exercise);
    const after = isReadyForTeacherExercise(30, 1, exercise);
    expect(before).toBe(true);
    expect(after).toBe(true);
  });

  it("denies access for a child who hasn't started the skill (order -1)", () => {
    expect(isReadyForTeacherExercise(1000, -1, { pointsRequired: 0, level: { order: 0 } })).toBe(false);
  });
});
