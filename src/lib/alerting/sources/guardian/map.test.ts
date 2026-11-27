import { describe, expect, it } from "vitest";
import documented from "./search.documented-shape.recorded.json";
import { mapGuardianSearch } from "./map";

// The fixture follows the Content API's documented response shape. It is not a
// real recording (no key in the build environment): re-record with a real key.

describe("mapGuardianSearch on the documented response shape", () => {
  const events = mapGuardianSearch(documented);

  it("keeps only world, business and environment articles with a valid date", () => {
    expect(events.map((e) => e.externalId)).toEqual([
      "world/2026/nov/27/ceasefire-talks-resume",
      "business/2026/nov/27/central-bank-holds-rates",
      "environment/2026/nov/26/reef-bleaching-record",
    ]);
  });

  it("uses the content id, low severity, title, url and publication date", () => {
    expect(events[0]).toMatchObject({
      externalId: "world/2026/nov/27/ceasefire-talks-resume",
      title: "Ceasefire talks resume as mediators report progress",
      url: "https://www.theguardian.com/world/2026/nov/27/ceasefire-talks-resume",
      severity: "low",
    });
    expect(events[0]?.occurredAt.toISOString()).toBe(
      "2026-11-27T08:15:00.000Z",
    );
  });

  it("turns the standfirst into plain text, falling back to the trail text", () => {
    expect(events[0]?.summary).toBe(
      "Negotiators say a framework is within reach & talks continue tomorrow.",
    );
    expect(events[1]?.summary).toBe("Policymakers cite persistent inflation.");
  });

  it("gives an empty summary when the article has no standfirst", () => {
    expect(events[2]?.summary).toBe("");
  });
});

describe("mapGuardianSearch on unexpected bodies", () => {
  it("gives no events for a body that is not a search response", () => {
    expect(mapGuardianSearch(null)).toEqual([]);
    expect(mapGuardianSearch({ message: "Invalid authentication" })).toEqual(
      [],
    );
    expect(mapGuardianSearch({ response: { status: "error" } })).toEqual([]);
  });
});
