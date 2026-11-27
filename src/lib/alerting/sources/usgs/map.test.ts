import { describe, expect, it } from "vitest";
import pastDay from "./past-day-4.5.recorded.json";
import significantMonth from "./significant-month.recorded.json";
import { mapUsgsFeed, severityFromMagnitude } from "./map";

/** One feed item shaped like USGS's, for the boundaries the recordings lack. */
function item(mag: number, alert: string | null = null, id = "us1") {
  return {
    type: "Feature",
    id,
    properties: {
      mag,
      place: "Somewhere",
      time: 1_795_783_696_841,
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      alert,
      title: `M ${mag} - Somewhere`,
    },
    geometry: { type: "Point", coordinates: [10, 20, 33.2] },
  };
}

function severityOf(mag: number, alert: string | null = null) {
  const [event] = mapUsgsFeed({ features: [item(mag, alert)] });
  return event?.severity;
}

describe("severity from magnitude", () => {
  it.each([
    [4.5, "low"],
    [5.4, "low"],
    [5.5, "moderate"],
    [6.4, "moderate"],
    [6.5, "high"],
    [7.4, "high"],
    [7.5, "critical"],
    [9.1, "critical"],
  ] as const)("magnitude %s is %s", (mag, expected) => {
    expect(severityFromMagnitude(mag)).toBe(expected);
    expect(severityOf(mag)).toBe(expected);
  });

  it("raises a low or moderate quake to high on an orange or red PAGER alert", () => {
    expect(severityOf(4.5, "orange")).toBe("high");
    expect(severityOf(5.9, "red")).toBe("high");
  });

  it("never lowers a critical quake and ignores green and yellow alerts", () => {
    expect(severityOf(8, "orange")).toBe("critical");
    expect(severityOf(4.8, "green")).toBe("low");
    expect(severityOf(4.8, "yellow")).toBe("low");
  });
});

describe("mapUsgsFeed on recorded responses", () => {
  it("maps every item of the past-day feed with the USGS id as external id", () => {
    const events = mapUsgsFeed(pastDay);
    expect(events).toHaveLength(8);
    expect(events[0]).toMatchObject({
      externalId: "us6000udwh",
      title: "M 4.5 - 131 km WNW of Neiafu, Tonga",
      url: "https://earthquake.usgs.gov/earthquakes/eventpage/us6000udwh",
      severity: "low",
    });
    expect(events[0]?.occurredAt).toEqual(new Date(1795783696841));
  });

  it("writes place, magnitude and depth into the summary", () => {
    const [first] = mapUsgsFeed(pastDay);
    expect(first?.summary).toBe(
      "Magnitude 4.5 earthquake, 131 km WNW of Neiafu, Tonga, depth 272 km.",
    );
  });

  it("maps a month of significant quakes onto the scale", () => {
    const bySeverity = Object.fromEntries(
      mapUsgsFeed(significantMonth).map((e) => [e.externalId, e.severity]),
    );
    expect(bySeverity["us6000ud6h"]).toBe("moderate"); // 6.4
    expect(bySeverity["us6000ucvm"]).toBe("high"); // 6.5
    expect(bySeverity["us7000tyw8"]).toBe("low"); // 5.3
  });

  it("keeps the provider's item as raw, JSON-serialisable", () => {
    const [first] = mapUsgsFeed(pastDay);
    expect(JSON.parse(JSON.stringify(first?.raw))).toEqual(first?.raw);
  });
});

describe("malformed items", () => {
  it("skips them without throwing and keeps the rest", () => {
    const events = mapUsgsFeed({
      features: [
        item(5, null, "good1"),
        { id: "nomag", properties: { place: "x", time: 1 } },
        "garbage",
        null,
        { ...item(5), id: undefined },
        item(6, null, "good2"),
      ],
    });
    expect(events.map((e) => e.externalId)).toEqual(["good1", "good2"]);
  });

  it("returns nothing for a body that is not a feed", () => {
    expect(mapUsgsFeed(null)).toEqual([]);
    expect(mapUsgsFeed({ features: "nope" })).toEqual([]);
  });
});
