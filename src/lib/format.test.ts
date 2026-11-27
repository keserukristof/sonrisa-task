import { describe, expect, it } from "vitest";
import { formatUtcDateTime, formatUtcTime } from "./format";

describe("formatting times", () => {
  it("shows a date and time in UTC, labelled", () => {
    expect(formatUtcDateTime("2026-11-27T13:42:10+00:00")).toBe(
      "27 Nov 2026, 13:42 UTC",
    );
  });

  it("converts another offset to UTC", () => {
    expect(formatUtcDateTime("2026-11-27T01:05:00+09:00")).toBe(
      "26 Nov 2026, 16:05 UTC",
    );
  });

  it("shows a time alone, labelled", () => {
    expect(formatUtcTime(new Date("2026-11-27T00:03:00Z"))).toBe("00:03 UTC");
  });
});
