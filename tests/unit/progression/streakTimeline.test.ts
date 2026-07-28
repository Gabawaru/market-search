import { describe, it, expect } from "vitest";
import { buildStreakTimeline } from "@/lib/progression/streakTimeline";

describe("buildStreakTimeline", () => {
  it("returns the requested number of days, ending on today", () => {
    const today = new Date("2026-01-15T12:00:00Z");
    const timeline = buildStreakTimeline([], today, 7);

    expect(timeline).toHaveLength(7);
    expect(timeline[timeline.length - 1].date.toISOString().slice(0, 10)).toBe("2026-01-15");
    expect(timeline[0].date.toISOString().slice(0, 10)).toBe("2026-01-09");
  });

  it("marks no day as active when there is no activity", () => {
    const today = new Date("2026-01-15T12:00:00Z");
    const timeline = buildStreakTimeline([], today, 5);
    expect(timeline.every((day) => !day.active)).toBe(true);
  });

  it("marks a day active regardless of the time of day the activity happened", () => {
    const today = new Date("2026-01-15T12:00:00Z");
    const timeline = buildStreakTimeline([new Date("2026-01-14T23:59:00Z")], today, 3);
    const jan14 = timeline.find((d) => d.date.toISOString().slice(0, 10) === "2026-01-14");
    expect(jan14?.active).toBe(true);
  });

  it("only marks the exact days with activity, leaving gaps as inactive", () => {
    const today = new Date("2026-01-15T12:00:00Z");
    const timeline = buildStreakTimeline(
      [new Date("2026-01-11T08:00:00Z"), new Date("2026-01-13T08:00:00Z")],
      today,
      5,
    );
    const byDate = Object.fromEntries(
      timeline.map((d) => [d.date.toISOString().slice(0, 10), d.active]),
    );
    expect(byDate).toEqual({
      "2026-01-11": true,
      "2026-01-12": false,
      "2026-01-13": true,
      "2026-01-14": false,
      "2026-01-15": false,
    });
  });
});
