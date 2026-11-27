import { describe, expect, it } from "vitest";
import {
  attemptsLabel,
  parseAdminNotifications,
  parseStatusFilter,
  statusHref,
  toAdminNotificationRow,
} from "./rows";

const raw = {
  id: "n1",
  status: "failed",
  channel_type: "slack",
  attempts: 2,
  last_error: "The Slack workspace didn't accept the message.",
  skip_reason: null,
  sent_at: null,
  next_attempt_at: "2026-11-27T13:56:00Z",
  created_at: "2026-11-27T13:00:00Z",
  event_title: "M 6.8 quake",
  event_occurred_at: "2026-11-27T12:00:00Z",
  event_simulated: true,
  owner_email: "ana@example.com",
  total_count: 61,
};

function detail(patch: object): string | null {
  const parsed = parseAdminNotifications([{ ...raw, ...patch }]);
  if (!parsed) throw new Error("did not parse");
  return parsed
    .map(toAdminNotificationRow)
    .map((r) => r.detail)
    .join("");
}

describe("parseStatusFilter", () => {
  it("accepts the four statuses and treats anything else as All", () => {
    expect(parseStatusFilter("failed")).toBe("failed");
    expect(parseStatusFilter("sent")).toBe("sent");
    expect(parseStatusFilter("bogus")).toBeNull();
    expect(parseStatusFilter(undefined)).toBeNull();
    expect(parseStatusFilter(["failed", "sent"])).toBeNull();
  });
});

describe("statusHref", () => {
  it("drops the parameter for All", () => {
    expect(statusHref(null)).toBe("/admin/notifications");
    expect(statusHref("failed")).toBe("/admin/notifications?status=failed");
    expect(statusHref("failed", 2)).toBe(
      "/admin/notifications?status=failed&page=2",
    );
    expect(statusHref(null, 3)).toBe("/admin/notifications?page=3");
  });
});

describe("attemptsLabel", () => {
  it("pluralises", () => {
    expect(attemptsLabel(0)).toBe("0 attempts");
    expect(attemptsLabel(1)).toBe("1 attempt");
    expect(attemptsLabel(2)).toBe("2 attempts");
  });
});

describe("toAdminNotificationRow", () => {
  it("shows the event, the owner, the destination and a known failure", () => {
    const parsed = parseAdminNotifications([raw]);
    if (!parsed) throw new Error("did not parse");
    expect(parsed.map(toAdminNotificationRow)).toMatchObject([
      {
        title: "M 6.8 quake",
        simulated: true,
        eventTime: "27 Nov 2026, 12:00 UTC",
        ownerEmail: "ana@example.com",
        destination: "Slack",
        attempts: "2 attempts",
        status: "failed",
        detail: "The Slack workspace didn't accept the message.",
      },
    ]);
  });

  it("never shows a raw provider message", () => {
    expect(detail({ last_error: "ECONNREFUSED 10.0.0.1:443" })).toBe(
      "The Slack message couldn't be sent after 2 attempts.",
    );
    expect(detail({ channel_type: "email", last_error: null })).toBe(
      "The email couldn't be sent after 2 attempts.",
    );
  });

  it("describes pending, sent and skipped rows", () => {
    expect(detail({ status: "pending", attempts: 0 })).toBe(
      "Waiting to be sent",
    );
    expect(detail({ status: "pending", attempts: 1 })).toBe(
      "Next attempt at 13:56 UTC",
    );
    expect(detail({ status: "sent", sent_at: "2026-11-27T13:43:00Z" })).toBe(
      "13:43 UTC",
    );
    expect(
      detail({ status: "skipped", skip_reason: "Hourly limit (10) reached" }),
    ).toBe("Hourly limit (10) reached");
  });

  it("rejects rows of an unexpected shape", () => {
    expect(parseAdminNotifications([{ ...raw, status: "weird" }])).toBeNull();
  });
});
