import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps a path on this site, with its query", () => {
    expect(safeNextPath("/notifications?page=2")).toBe("/notifications?page=2");
  });

  it("falls back to /alerts for another site, however it is written", () => {
    expect(safeNextPath("https://evil.example/alerts")).toBe("/alerts");
    expect(safeNextPath("//evil.example")).toBe("/alerts");
    expect(safeNextPath("/\\evil.example")).toBe("/alerts");
  });

  it("falls back to /alerts when next is missing or not a string", () => {
    expect(safeNextPath(undefined)).toBe("/alerts");
    expect(safeNextPath(["/alerts", "/admin"])).toBe("/alerts");
  });
});
