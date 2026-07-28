import { describe, it, expect } from "vitest";
import { computeNextStreak } from "@/lib/progression/streaks";

describe("computeNextStreak", () => {
  it("starts a streak the first time there is no prior activity", () => {
    const result = computeNextStreak(null, new Date("2026-01-10T10:00:00Z"), 0);
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false, freezeConsumed: false });
  });

  it("does not double-count activity on the same day", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-10T20:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 5, alreadyCountedToday: true, freezeConsumed: false });
  });

  it("increments the streak on consecutive days", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-11T08:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 6, alreadyCountedToday: false, freezeConsumed: false });
  });

  it("resets the streak to 1 after a gap of more than one day", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-13T08:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false, freezeConsumed: false });
  });

  it("resets the streak after missing exactly one day when no streak freeze is available", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-12T08:00:00Z"),
      5,
      0,
    );
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false, freezeConsumed: false });
  });

  it("uses a streak freeze to protect the streak after missing exactly one day", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-12T08:00:00Z"),
      5,
      1,
    );
    expect(result).toEqual({ nextStreak: 6, alreadyCountedToday: false, freezeConsumed: true });
  });

  it("does not consume a streak freeze on consecutive days (nothing to protect)", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-11T08:00:00Z"),
      5,
      3,
    );
    expect(result).toEqual({ nextStreak: 6, alreadyCountedToday: false, freezeConsumed: false });
  });

  it("does not cover a gap of two or more missed days with a single streak freeze", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-14T08:00:00Z"),
      5,
      3,
    );
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false, freezeConsumed: false });
  });
});
