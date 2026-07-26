import { describe, it, expect } from "vitest";
import { decideIntegrityAction } from "@/lib/integrity/events";

describe("decideIntegrityAction", () => {
  it("zeroes only the current question on a first focus loss", () => {
    expect(decideIntegrityAction("WINDOW_BLUR", 0)).toEqual({
      severity: "MEDIUM",
      action: "ZEROED_QUESTION",
    });
    expect(decideIntegrityAction("VISIBILITY_HIDDEN", 0)).toEqual({
      severity: "MEDIUM",
      action: "ZEROED_QUESTION",
    });
  });

  it("invalidates the whole evaluation on a repeated focus loss", () => {
    expect(decideIntegrityAction("WINDOW_BLUR", 1)).toEqual({
      severity: "HIGH",
      action: "ZEROED_EVALUATION",
    });
    expect(decideIntegrityAction("VISIBILITY_HIDDEN", 2)).toEqual({
      severity: "HIGH",
      action: "ZEROED_EVALUATION",
    });
  });

  it("invalidates the whole evaluation immediately on fullscreen exit", () => {
    expect(decideIntegrityAction("FULLSCREEN_EXIT", 0)).toEqual({
      severity: "HIGH",
      action: "ZEROED_EVALUATION",
    });
  });

  it("never auto-zeroes on devtools suspicion or clipboard attempts alone", () => {
    expect(decideIntegrityAction("DEVTOOLS_SUSPECTED", 0).action).toBe("WARNED");
    expect(decideIntegrityAction("COPY_ATTEMPT", 5).action).toBe("WARNED");
    expect(decideIntegrityAction("PASTE_ATTEMPT", 5).action).toBe("WARNED");
  });

  it("never auto-zeroes on AI text suspicion alone", () => {
    expect(decideIntegrityAction("AI_TEXT_SUSPECTED", 0).action).toBe("LOGGED_ONLY");
    expect(decideIntegrityAction("AI_TEXT_SUSPECTED", 10).action).toBe("LOGGED_ONLY");
  });

  it("only logs session/heartbeat anomalies, does not zero anything by itself", () => {
    expect(decideIntegrityAction("SESSION_TOKEN_INVALID", 0).action).toBe("LOGGED_ONLY");
    expect(decideIntegrityAction("HEARTBEAT_MISSED", 0).action).toBe("LOGGED_ONLY");
  });
});
