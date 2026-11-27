import { describe, expect, it } from "vitest";
import { parseRawEvents, toEventRow, type RawEvent } from "./event-row";

const raw: RawEvent = {
  id: "e1",
  source: "guardian",
  category: "news",
  severity: "low",
  title: "Storm hits coast",
  occurred_at: "2026-11-27T13:42:00Z",
  simulated: false,
};

describe("toEventRow", () => {
  it("names the source, labels the category and credits the source", () => {
    expect(toEventRow(raw)).toEqual({
      id: "e1",
      title: "Storm hits coast",
      simulated: false,
      time: "27 Nov 2026, 13:42 UTC",
      sourceName: "The Guardian",
      categoryLabel: "News",
      credit: "Source: The Guardian",
      severity: "low",
    });
  });

  it("gives a simulated event no credit", () => {
    const row = toEventRow({ ...raw, source: "simulated", simulated: true });
    expect(row.sourceName).toBe("Simulated");
    expect(row.credit).toBeNull();
    expect(row.simulated).toBe(true);
  });
});

describe("parseRawEvents", () => {
  it("accepts rows of the expected shape", () => {
    expect(parseRawEvents([raw])).toEqual([raw]);
  });

  it("rejects an unexpected shape", () => {
    expect(parseRawEvents([{ ...raw, severity: "huge" }])).toBeNull();
  });
});
