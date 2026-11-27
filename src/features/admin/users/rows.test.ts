import { describe, expect, it } from "vitest";
import { alertsLabel, parseAdminUsers, toAdminUserRow } from "./rows";

const raw = {
  user_id: "u1",
  email: "ana@example.com",
  role: "admin",
  created_at: "2026-11-27T09:30:00Z",
  alert_count: 12,
  total_count: 3,
};

describe("alertsLabel", () => {
  it("pluralises", () => {
    expect(alertsLabel(0)).toBe("0 alerts");
    expect(alertsLabel(1)).toBe("1 alert");
    expect(alertsLabel(12)).toBe("12 alerts");
  });
});

describe("toAdminUserRow", () => {
  it("shows the role, the sign-up date without a time and the alerts", () => {
    const parsed = parseAdminUsers([
      raw,
      { ...raw, user_id: "u2", role: "user" },
    ]);
    if (!parsed) throw new Error("did not parse");
    expect(parsed.map(toAdminUserRow)).toEqual([
      {
        id: "u1",
        email: "ana@example.com",
        role: "Admin",
        signedUp: "27 Nov 2026",
        alerts: "12 alerts",
      },
      {
        id: "u2",
        email: "ana@example.com",
        role: "User",
        signedUp: "27 Nov 2026",
        alerts: "12 alerts",
      },
    ]);
  });

  it("rejects rows of an unexpected shape", () => {
    expect(parseAdminUsers([{ ...raw, role: "root" }])).toBeNull();
  });
});
