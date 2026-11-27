import { describe, expect, it } from "vitest";
import { planRetry } from "./retry";

const delays = [60, 300, 900];

describe("planRetry", () => {
  it("waits 1, 5 then 15 minutes after the first three attempts", () => {
    expect(planRetry(1, delays)).toEqual({ kind: "later", delaySeconds: 60 });
    expect(planRetry(2, delays)).toEqual({ kind: "later", delaySeconds: 300 });
    expect(planRetry(3, delays)).toEqual({ kind: "later", delaySeconds: 900 });
  });

  it("gives up after the fourth attempt", () => {
    expect(planRetry(4, delays)).toEqual({ kind: "give_up" });
  });

  it("honours a longer wait the provider asked for, never a shorter one", () => {
    expect(planRetry(1, delays, 120)).toEqual({
      kind: "later",
      delaySeconds: 120,
    });
    expect(planRetry(2, delays, 10)).toEqual({
      kind: "later",
      delaySeconds: 300,
    });
  });
});
