import { describe, expect, it } from "vitest";
import recorded from "./markets.recorded.json";
import { mapCoingeckoMarkets, severityFromChange } from "./map";

const now = new Date("2026-11-27T18:05:42.000Z");

function coin(oneHour: number | null, overrides: Record<string, unknown> = {}) {
  return {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    current_price: 142.5,
    price_change_percentage_24h: 2,
    last_updated: "2026-11-27T18:04:00.000Z",
    price_change_percentage_1h_in_currency: oneHour,
    price_change_percentage_24h_in_currency: 2,
    ...overrides,
  };
}

function severityOf(change: number) {
  return mapCoingeckoMarkets([coin(change)], now)[0]?.severity;
}

describe("severity from the 1-hour change", () => {
  it.each([
    [3, "low"],
    [4.99, "low"],
    [5, "moderate"],
    [7.99, "moderate"],
    [8, "high"],
    [12, "high"],
    [12.01, "critical"],
  ] as const)("%s%% is %s", (change, expected) => {
    expect(severityOf(change)).toBe(expected);
    expect(severityOf(-change)).toBe(expected);
    expect(severityFromChange(change)).toBe(expected);
  });
});

describe("mapCoingeckoMarkets on the recorded response", () => {
  it("reports only coins whose hour change is at least 3% either way", () => {
    const events = mapCoingeckoMarkets(recorded, now);
    expect(events.map((e) => e.externalId)).toEqual([
      "bitcoin:2026-11-27T18:05",
      "ethereum:2026-11-27T18:05",
    ]);
  });

  it("writes the title, summary, link and severity", () => {
    const [up, down] = mapCoingeckoMarkets(recorded, now);
    expect(up).toMatchObject({
      title: "Bitcoin (BTC) up 4.2% in the past hour",
      summary: "Price $64,210. 24-hour change −1.8%.",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      severity: "low",
      occurredAt: now,
    });
    expect(down).toMatchObject({
      title: "Ethereum (ETH) down 3.6% in the past hour",
      summary: "Price $3,120.55. 24-hour change +0.4%.",
      url: "https://www.coingecko.com/en/coins/ethereum",
    });
  });
});

describe("mapCoingeckoMarkets edge cases", () => {
  it("ignores 2.99% and a missing hour change", () => {
    expect(mapCoingeckoMarkets([coin(2.99), coin(null)], now)).toEqual([]);
  });

  it("skips a malformed item and keeps the rest", () => {
    const events = mapCoingeckoMarkets([{ nope: true }, coin(5)], now);
    expect(events).toHaveLength(1);
  });

  it("gives no events for a body that is not a list", () => {
    expect(mapCoingeckoMarkets({ error: "rate limited" }, now)).toEqual([]);
  });

  it("omits the 24-hour change when it is unknown", () => {
    const [event] = mapCoingeckoMarkets(
      [
        coin(4, {
          price_change_percentage_24h: null,
          price_change_percentage_24h_in_currency: null,
        }),
      ],
      now,
    );
    expect(event?.summary).toBe("Price $142.50.");
  });
});
