import { describe, expect, it } from "vitest";
import {
  parsePage,
  parseRawNotifications,
  toNotificationRow,
  type RawNotification,
} from "./notification-row";

function raw(overrides: Partial<RawNotification> = {}): RawNotification {
  return {
    id: "n1",
    status: "sent",
    attempts: 1,
    next_attempt_at: "2026-11-27T13:56:00+00:00",
    last_error: null,
    skip_reason: null,
    sent_at: "2026-11-27T13:43:00+00:00",
    channel_type: "email",
    events: {
      title: "M 6.8 - Hualien",
      severity: "high",
      occurred_at: "2026-11-27T13:42:00+00:00",
      simulated: false,
      source: "usgs",
    },
    alerts: { name: "Quakes" },
    destinations: { name: "Account email" },
    ...overrides,
  };
}

describe("parseRawNotifications", () => {
  it("accepts rows shaped like the query's", () => {
    expect(parseRawNotifications([raw()])).toEqual([raw()]);
  });

  it("rejects a row with an unknown status", () => {
    expect(
      parseRawNotifications([{ ...raw(), status: "exploded" }]),
    ).toBeNull();
  });

  it("rejects something that is not a list of rows", () => {
    expect(parseRawNotifications({ id: "n1" })).toBeNull();
  });
});

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["3", 3],
    ["0", 1],
    ["-2", 1],
    ["1.5", 1],
    ["abc", 1],
    ["", 1],
    [["2", "3"], 1],
  ])("reads %j as page %i", (input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });
});

describe("toNotificationRow", () => {
  it("shows the event time, alert and destination of a sent notification", () => {
    const row = toNotificationRow(raw());
    expect(row.eventTime).toBe("27 Nov 2026, 13:42 UTC");
    expect(row.alertName).toBe("Quakes");
    expect(row.destinationName).toBe("Account email");
    expect(row.status).toBe("sent");
    expect(row.detail).toBe("13:43 UTC");
    expect(row.simulated).toBe(false);
  });

  it("has no alert name when the alert was deleted", () => {
    expect(toNotificationRow(raw({ alerts: null })).alertName).toBeNull();
  });

  it("shows the skip reason as it arrives", () => {
    const row = toNotificationRow(
      raw({
        status: "skipped",
        skip_reason: "Hourly limit (10) reached",
        sent_at: null,
      }),
    );
    expect(row.detail).toBe("Hourly limit (10) reached");
  });

  it("shows a known failure sentence", () => {
    const row = toNotificationRow(
      raw({
        status: "failed",
        last_error: "The email provider didn't respond after 4 attempts.",
      }),
    );
    expect(row.detail).toBe(
      "The email provider didn't respond after 4 attempts.",
    );
  });

  it("never shows a raw provider message for a failure", () => {
    const row = toNotificationRow(
      raw({
        status: "failed",
        attempts: 4,
        last_error: "SMTPError 550: relay denied at 10.0.0.1",
      }),
    );
    expect(row.detail).toBe("The email couldn't be sent after 4 attempts.");
  });

  it("says a pending notification waits before its first attempt", () => {
    const row = toNotificationRow(
      raw({ status: "pending", attempts: 0, sent_at: null }),
    );
    expect(row.detail).toBe("Waiting to be sent");
  });

  it("gives the next attempt time of a retrying notification", () => {
    const row = toNotificationRow(
      raw({ status: "pending", attempts: 1, sent_at: null }),
    );
    expect(row.detail).toBe("Next attempt at 13:56 UTC");
  });
});

describe("credits", () => {
  it.each([
    ["usgs", "U.S. Geological Survey"],
    ["guardian", "Source: The Guardian"],
    ["coingecko", "Powered by CoinGecko"],
  ])("credits %s events", (source, credit) => {
    const events = raw().events;
    if (!events) throw new Error("fixture");
    expect(
      toNotificationRow(raw({ events: { ...events, source } })).credit,
    ).toBe(credit);
  });

  it("gives a simulated event no credit", () => {
    const events = raw().events;
    if (!events) throw new Error("fixture");
    const row = toNotificationRow(
      raw({ events: { ...events, source: "simulated", simulated: true } }),
    );
    expect(row.credit).toBeNull();
  });
});

describe("destination label", () => {
  it("shows an email destination by its name", () => {
    expect(toNotificationRow(raw()).destinationName).toBe("Account email");
  });

  it("shows a Slack destination as Slack · name", () => {
    const row = toNotificationRow(
      raw({ channel_type: "slack", destinations: { name: "#ops" } }),
    );
    expect(row.destinationName).toBe("Slack \u00b7 #ops");
  });

  it("keeps the Slack prefix once the destination is removed", () => {
    const row = toNotificationRow(
      raw({ channel_type: "slack", destinations: null }),
    );
    expect(row.destinationName).toBe("Slack \u00b7 Removed destination");
  });
});

describe("failure sentences by channel", () => {
  it.each([
    "The Slack channel no longer exists.",
    "The Slack destination was removed.",
    "The Slack webhook didn't respond after 4 attempts.",
  ])("shows %s", (sentence) => {
    const row = toNotificationRow(
      raw({ status: "failed", channel_type: "slack", last_error: sentence }),
    );
    expect(row.detail).toBe(sentence);
  });

  it("names Slack in the fallback for a Slack notification", () => {
    const row = toNotificationRow(
      raw({
        status: "failed",
        attempts: 4,
        channel_type: "slack",
        last_error: "HTTP 500 from hooks.slack.com/T0/B0/secret",
      }),
    );
    expect(row.detail).toBe(
      "The Slack message couldn't be sent after 4 attempts.",
    );
  });

  it("rejects a sentence that does not start with a channel or end with a full stop", () => {
    for (const bad of [
      "Slack is down.",
      "The Slack channel is gone",
      "The Teams hook failed.",
    ]) {
      const row = toNotificationRow(
        raw({ status: "failed", attempts: 2, last_error: bad }),
      );
      expect(row.detail).toBe("The email couldn't be sent after 2 attempts.");
    }
  });
});
