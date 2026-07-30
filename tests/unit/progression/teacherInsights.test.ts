import { describe, it, expect } from "vitest";
import { grantsTeacherVisibility } from "@/lib/progression/teacherInsights";

describe("grantsTeacherVisibility", () => {
  it("opens visibility once an accompaniment is actually established", () => {
    expect(grantsTeacherVisibility("ACCEPTED")).toBe(true);
    expect(grantsTeacherVisibility("ACTIVE")).toBe(true);
  });

  it("keeps visibility after the accompaniment has ended", () => {
    expect(grantsTeacherVisibility("ENDED")).toBe(true);
  });

  it("grants nothing on a request the teacher has not accepted yet", () => {
    expect(grantsTeacherVisibility("PENDING")).toBe(false);
  });

  it("grants nothing on a declined request", () => {
    expect(grantsTeacherVisibility("DECLINED")).toBe(false);
  });
});
