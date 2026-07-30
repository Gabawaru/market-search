import { describe, it, expect } from "vitest";
import { contentOriginIcon, contentOriginLabel } from "@/lib/content/contentOrigin";

describe("contentOriginLabel", () => {
  it("names the teacher when we know who wrote the exercise", () => {
    expect(contentOriginLabel("teacher", "Mme Diallo")).toBe("Écrit et corrigé par Mme Diallo");
  });

  it("still credits a real teacher when the name is missing", () => {
    expect(contentOriginLabel("teacher", null)).toBe("Écrit et corrigé par un vrai prof");
    expect(contentOriginLabel("teacher")).toBe("Écrit et corrigé par un vrai prof");
  });

  it("keeps the generated wording positive and never mentions a teacher", () => {
    const label = contentOriginLabel("generated");
    expect(label).toBe("Généré automatiquement pour toi");
    expect(label.toLowerCase()).not.toContain("prof");
  });

  it("ignores an author name for generated content", () => {
    expect(contentOriginLabel("generated", "Mme Diallo")).toBe("Généré automatiquement pour toi");
  });
});

describe("contentOriginIcon", () => {
  it("uses a distinct icon per origin", () => {
    expect(contentOriginIcon("teacher")).not.toBe(contentOriginIcon("generated"));
  });
});
