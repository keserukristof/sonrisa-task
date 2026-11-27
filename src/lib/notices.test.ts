import { describe, expect, it } from "vitest";
import { isNoticeKey, withNotice } from "./notices";

describe("notices", () => {
  it("adds the notice to a path, with or without a query", () => {
    expect(withNotice("/alerts", "alert-created")).toBe(
      "/alerts?notice=alert-created",
    );
    expect(withNotice("/alerts?page=2", "alert-deleted")).toBe(
      "/alerts?page=2&notice=alert-deleted",
    );
  });

  it("recognises only the known keys", () => {
    expect(isNoticeKey("email-confirmed")).toBe(true);
    expect(isNoticeKey("toString")).toBe(false);
    expect(isNoticeKey(["alert-created"])).toBe(false);
  });
});
