import { describe, expect, it } from "vitest";
import { sourceCredit, sourceName, sourceStatus } from "./catalog";

const now = new Date("2026-11-27T18:50:00Z");

describe("sourceCredit", () => {
  it("credits each real source as its terms ask", () => {
    expect(sourceCredit("usgs")).toBe("U.S. Geological Survey");
    expect(sourceCredit("guardian")).toBe("Source: The Guardian");
    expect(sourceCredit("coingecko")).toBe("Powered by CoinGecko");
  });

  it("gives simulated and unknown sources no credit", () => {
    expect(sourceCredit("simulated")).toBeNull();
    expect(sourceCredit("somewhere")).toBeNull();
  });
});

describe("sourceName", () => {
  it("names simulated events Simulated", () => {
    expect(sourceName("simulated")).toBe("Simulated");
    expect(sourceName("guardian")).toBe("The Guardian");
  });
});

describe("sourceStatus", () => {
  it("is ok when the last poll succeeded within three intervals", () => {
    expect(
      sourceStatus(
        180,
        {
          lastOutcome: "ok",
          lastSuccessAt: new Date("2026-11-27T18:42:00Z"),
        },
        now,
      ),
    ).toBe("ok");
  });

  it("is late when the last success is older than three intervals", () => {
    // The Guardian polls every 3 minutes: 9 minutes and one second is late.
    expect(
      sourceStatus(
        180,
        {
          lastOutcome: "ok",
          lastSuccessAt: new Date("2026-11-27T18:40:59Z"),
        },
        now,
      ),
    ).toBe("late");
  });

  it("is failing when the last poll failed, even if it is also late", () => {
    expect(
      sourceStatus(
        60,
        {
          lastOutcome: "error",
          lastSuccessAt: new Date("2026-11-27T10:00:00Z"),
        },
        now,
      ),
    ).toBe("failing");
  });

  it("is late when the source has never been polled", () => {
    expect(
      sourceStatus(300, { lastOutcome: null, lastSuccessAt: null }, now),
    ).toBe("late");
  });
});
