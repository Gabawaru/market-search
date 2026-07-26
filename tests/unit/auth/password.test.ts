import { describe, it, expect } from "vitest";
import { hashSecret, verifySecret } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a correct secret against its hash", async () => {
    const hash = await hashSecret("SuperSecret123");
    await expect(verifySecret("SuperSecret123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect secret", async () => {
    const hash = await hashSecret("SuperSecret123");
    await expect(verifySecret("WrongSecret", hash)).resolves.toBe(false);
  });

  it("hashes a short numeric PIN just as well", async () => {
    const hash = await hashSecret("1234");
    await expect(verifySecret("1234", hash)).resolves.toBe(true);
    await expect(verifySecret("4321", hash)).resolves.toBe(false);
  });
});
