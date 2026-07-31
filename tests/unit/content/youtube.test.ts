import { describe, it, expect } from "vitest";
import { extractYouTubeVideoId } from "@/lib/content/youtube";

describe("extractYouTubeVideoId", () => {
  it("extracts the id from a standard watch URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=abc123XYZ")).toBe("abc123XYZ");
  });

  it("extracts the id from a shortened youtu.be URL", () => {
    expect(extractYouTubeVideoId("https://youtu.be/abc123XYZ")).toBe("abc123XYZ");
  });

  it("extracts the id from an already-embedded URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/abc123XYZ")).toBe("abc123XYZ");
  });

  it("returns null for an unrecognized URL", () => {
    expect(extractYouTubeVideoId("https://example.com/video")).toBe(null);
  });

  it("returns null for a malformed URL", () => {
    expect(extractYouTubeVideoId("not a url")).toBe(null);
  });
});
