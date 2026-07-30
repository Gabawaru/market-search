import { describe, it, expect } from "vitest";
import {
  HELP_OFFER_CONSECUTIVE_INCORRECT,
  countTrailingIncorrect,
  shouldOfferHelp,
} from "@/lib/progression/helpRequests";

describe("countTrailingIncorrect", () => {
  it("returns 0 when there is no attempt at all", () => {
    expect(countTrailingIncorrect([])).toBe(0);
  });

  it("returns 0 when the most recent attempt is correct", () => {
    expect(
      countTrailingIncorrect([{ isCorrect: true }, { isCorrect: false }, { isCorrect: false }]),
    ).toBe(0);
  });

  it("counts only the unbroken run of recent mistakes", () => {
    expect(
      countTrailingIncorrect([{ isCorrect: false }, { isCorrect: false }, { isCorrect: true }]),
    ).toBe(2);
  });

  it("counts every attempt when they are all wrong", () => {
    expect(
      countTrailingIncorrect([{ isCorrect: false }, { isCorrect: false }, { isCorrect: false }]),
    ).toBe(3);
  });
});

describe("shouldOfferHelp", () => {
  it("stays quiet below the threshold", () => {
    expect(shouldOfferHelp(HELP_OFFER_CONSECUTIVE_INCORRECT - 1)).toBe(false);
  });

  it("offers help at the threshold", () => {
    expect(shouldOfferHelp(HELP_OFFER_CONSECUTIVE_INCORRECT)).toBe(true);
  });

  it("keeps offering help beyond the threshold", () => {
    expect(shouldOfferHelp(HELP_OFFER_CONSECUTIVE_INCORRECT + 5)).toBe(true);
  });
});
