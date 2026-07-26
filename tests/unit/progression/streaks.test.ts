import { describe, it, expect } from "vitest";
import { computeNextStreak } from "@/lib/progression/streaks";

describe("computeNextStreak", () => {
  it("starts a streak the first time there is no prior activity", () => {
    const result = computeNextStreak(null, new Date("2026-01-10T10:00:00Z"), 0);
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false });
  });

  it("does not double-count activity on the same day", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-10T20:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 5, alreadyCountedToday: true });
  });

  it("increments the streak on consecutive days", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-11T08:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 6, alreadyCountedToday: false });
  });

  it("resets the streak to 1 after a gap of more than one day", () => {
    const result = computeNextStreak(
      new Date("2026-01-10T08:00:00Z"),
      new Date("2026-01-13T08:00:00Z"),
      5,
    );
    expect(result).toEqual({ nextStreak: 1, alreadyCountedToday: false });
  });
});
