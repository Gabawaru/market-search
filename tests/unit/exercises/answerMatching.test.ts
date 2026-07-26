import { describe, it, expect } from "vitest";
import { answersMatch } from "@/lib/exercises/answerMatching";

describe("answersMatch", () => {
  it("matches identical numbers", () => {
    expect(answersMatch("42", "42")).toBe(true);
  });

  it("matches numbers with surrounding whitespace", () => {
    expect(answersMatch(" 42 ", "42")).toBe(true);
  });

  it("matches numeric equivalence (e.g. 3.0 vs 3)", () => {
    expect(answersMatch("3.0", "3")).toBe(true);
  });

  it("rejects a wrong number", () => {
    expect(answersMatch("41", "42")).toBe(false);
  });

  it("matches equivalent fractions", () => {
    expect(answersMatch("2/4", "1/2")).toBe(true);
    expect(answersMatch("1/2", "1/2")).toBe(true);
  });

  it("rejects non-equivalent fractions", () => {
    expect(answersMatch("1/3", "1/2")).toBe(false);
  });

  it("rejects empty answers", () => {
    expect(answersMatch("", "42")).toBe(false);
  });
});
