import { describe, it, expect } from "vitest";
import { isStrugglingWithSkill } from "@/lib/progression/unlockRules";

const level = { unlockThreshold: 0.9, minExerciseCount: 15 };

describe("isStrugglingWithSkill", () => {
  it("is false before the child has even reached the normal exercise count", () => {
    expect(isStrugglingWithSkill(0.3, 10, level)).toBe(false);
  });

  it("is false once mastery is high enough, no matter how many attempts", () => {
    expect(isStrugglingWithSkill(0.95, 100, level)).toBe(false);
  });

  it("is false right at the normal threshold if mastery is still low (not yet 'stuck', just not ready)", () => {
    expect(isStrugglingWithSkill(0.3, 15, level)).toBe(false);
  });

  it("is true once attempts pass double the normal count with mastery still under threshold", () => {
    expect(isStrugglingWithSkill(0.3, 30, level)).toBe(true);
  });
});
