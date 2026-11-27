import { describe, expect, it } from "vitest";
import { isAtLeast, severityRank } from "./types";

describe("severity scale", () => {
  it("ranks the four levels from 1 to 4", () => {
    expect(severityRank("low")).toBe(1);
    expect(severityRank("moderate")).toBe(2);
    expect(severityRank("high")).toBe(3);
    expect(severityRank("critical")).toBe(4);
  });

  it("treats a level as at least itself and every lower level", () => {
    expect(isAtLeast("high", "moderate")).toBe(true);
    expect(isAtLeast("high", "high")).toBe(true);
    expect(isAtLeast("moderate", "high")).toBe(false);
  });
});
