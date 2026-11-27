import { describe, expect, it } from "vitest";
import { removeRefusal } from "./remove-refusal";

describe("removeRefusal", () => {
  it("counts the alerts", () => {
    expect(removeRefusal("Ops channel", 2)).toBe(
      "Ops channel is the only destination of 2 alerts. Change them first.",
    );
  });

  it("says 1 alert in the singular", () => {
    expect(removeRefusal("Ops channel", 1)).toBe(
      "Ops channel is the only destination of 1 alert. Change them first.",
    );
  });
});
