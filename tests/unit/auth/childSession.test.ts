import { describe, it, expect, beforeAll } from "vitest";
import { createChildSessionToken, verifyChildSessionToken } from "@/lib/auth/childSession";

beforeAll(() => {
  process.env.CHILD_SESSION_SECRET ??= "test-only-secret-not-for-production-use-1234567890";
});

describe("child session token", () => {
  it("round-trips a valid payload", async () => {
    const token = await createChildSessionToken({
      childId: "child_1",
      parentId: "parent_1",
      name: "Léo",
    });
    const payload = await verifyChildSessionToken(token);
    expect(payload).toEqual({ childId: "child_1", parentId: "parent_1", name: "Léo" });
  });

  it("rejects a tampered token", async () => {
    const token = await createChildSessionToken({
      childId: "child_1",
      parentId: "parent_1",
      name: "Léo",
    });
    const tampered = token.slice(0, -2) + "xx";
    const payload = await verifyChildSessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("rejects garbage input", async () => {
    const payload = await verifyChildSessionToken("not-a-jwt");
    expect(payload).toBeNull();
  });
});
