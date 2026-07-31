import { describe, it, expect } from "vitest";
import { isStrugglingWithSkill, canAttemptSkipEvaluation } from "@/lib/progression/unlockRules";

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

describe("canAttemptSkipEvaluation", () => {
  const now = new Date("2026-07-31T12:00:00Z");

  it("is true when there is no previous evaluation on this level", () => {
    expect(canAttemptSkipEvaluation(null, now, 24)).toBe(true);
  });

  it("is false right after a previous attempt, within the cooldown window", () => {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(canAttemptSkipEvaluation(oneHourAgo, now, 24)).toBe(false);
  });

  it("is true once the cooldown window has fully elapsed", () => {
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(canAttemptSkipEvaluation(twentyFiveHoursAgo, now, 24)).toBe(true);
  });

  it("is exactly on the boundary at the cooldown limit", () => {
    const exactlyCooldownAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(canAttemptSkipEvaluation(exactlyCooldownAgo, now, 24)).toBe(true);
  });
});
