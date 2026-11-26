import { describe, expect, it } from "vitest";
import { toHealthStatus } from "./health-status";

describe("toHealthStatus", () => {
  it("reports ok with the database clock when the probe succeeds", () => {
    expect(toHealthStatus("2026-11-26T18:00:00+00:00")).toEqual({
      status: "ok",
      databaseTime: "2026-11-26T18:00:00+00:00",
    });
  });

  it("reports degraded with the reason when the probe errors", () => {
    expect(toHealthStatus(null, "connection refused")).toEqual({
      status: "degraded",
      reason: "connection refused",
    });
  });

  it("reports degraded when the probe returns nothing", () => {
    expect(toHealthStatus(null)).toEqual({
      status: "degraded",
      reason: "Database returned no timestamp.",
    });
  });
});
