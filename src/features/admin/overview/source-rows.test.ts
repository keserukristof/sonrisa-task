import { describe, expect, it } from "vitest";
import { buildSourceRows, type PollRecord } from "./source-rows";

const now = new Date("2026-11-27T12:00:00Z");

function poll(over: Partial<PollRecord> & { source: string }): PollRecord {
  return {
    lastPolledAt: "2026-11-27T11:59:00Z",
    lastOutcome: "ok",
    lastError: null,
    lastEventsStored: 2,
    lastSuccessAt: "2026-11-27T11:59:00Z",
    ...over,
  };
}

describe("buildSourceRows", () => {
  it("lists every catalog source in order, a missing one as never polled and late", () => {
    const rows = buildSourceRows([], now);
    expect(rows.map((r) => r.id)).toEqual(["usgs", "guardian", "coingecko"]);
    expect(rows[0]).toMatchObject({
      status: "late",
      lastPoll: null,
      outcome: null,
      eventsStored: null,
    });
  });

  it("is ok when the last poll succeeded within three intervals", () => {
    const [usgs] = buildSourceRows([poll({ source: "usgs" })], now);
    expect(usgs).toMatchObject({
      status: "ok",
      lastPoll: "11:59 UTC",
      outcome: "Succeeded",
      eventsStored: 2,
    });
  });

  it("is late after three intervals (usgs: 3 minutes)", () => {
    const rows = buildSourceRows(
      [poll({ source: "usgs", lastSuccessAt: "2026-11-27T11:56:30Z" })],
      now,
    );
    expect(rows[0]?.status).toBe("late");
  });

  it("is failing when the last poll failed, with the stored error, and wins over late", () => {
    const rows = buildSourceRows(
      [
        poll({
          source: "guardian",
          lastOutcome: "error",
          lastError: "The Guardian did not answer.",
          lastSuccessAt: "2026-11-26T01:00:00Z",
          lastPolledAt: "2026-11-26T01:05:00Z",
        }),
      ],
      now,
    );
    expect(rows[1]).toMatchObject({
      status: "failing",
      outcome: "Failed: The Guardian did not answer.",
      lastPoll: "26 Nov 2026, 01:05 UTC",
    });
  });
});
