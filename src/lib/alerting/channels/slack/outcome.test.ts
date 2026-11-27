import { describe, expect, it } from "vitest";
import { classifySlackResponse } from "./outcome";

const answer = (
  status: number,
  body: string | null = "",
  retryAfter: string | null = null,
) => classifySlackResponse({ status, body, retryAfter });

const REVOKED = {
  error: "The Slack webhook was removed or revoked.",
  destinationReason: "Slack says this webhook was removed or revoked.",
};

describe("classifySlackResponse", () => {
  it("is sent for a 200 ok", () => {
    expect(answer(200, "ok")).toEqual({ kind: "sent" });
  });

  it.each([
    ["no_service", REVOKED],
    ["invalid_token", REVOKED],
    ["no_active_hooks", REVOKED],
    [
      "channel_not_found",
      {
        error: "The Slack channel no longer exists.",
        destinationReason: "Slack says this channel no longer exists.",
      },
    ],
    [
      "channel_is_archived",
      {
        error: "The Slack channel is archived.",
        destinationReason: "Slack says this channel is archived.",
      },
    ],
    [
      "action_prohibited",
      {
        error: "The Slack workspace blocks this webhook.",
        destinationReason: "Slack's workspace settings block this webhook.",
      },
    ],
    [
      "team_disabled",
      {
        error: "The Slack workspace is no longer active.",
        destinationReason: "Slack says this workspace is no longer active.",
      },
    ],
  ])("breaks on %s", (code, reasons) => {
    expect(answer(403, code)).toEqual({ kind: "broken", ...reasons });
  });

  it("reads a gone channel from a bare 404 and a revoked webhook from a 410", () => {
    expect(answer(404, "")).toMatchObject({
      kind: "broken",
      error: "The Slack channel no longer exists.",
    });
    expect(answer(410, "gone")).toMatchObject({
      kind: "broken",
      error: "The Slack webhook was removed or revoked.",
    });
  });

  it("prefers the body's code over the status", () => {
    expect(answer(404, "channel_is_archived")).toMatchObject({
      error: "The Slack channel is archived.",
    });
  });

  it("ignores whitespace around the body", () => {
    expect(answer(404, "no_service\n")).toMatchObject(REVOKED);
  });

  it("retries a 429 with the Retry-After seconds", () => {
    expect(answer(429, "", "30")).toEqual({
      kind: "retry",
      error: "The Slack service asked us to slow down.",
      retryAfterSeconds: 30,
    });
  });

  it("retries a 429 without a usable Retry-After", () => {
    expect(answer(429, "", "soon")).toEqual({
      kind: "retry",
      error: "The Slack service asked us to slow down.",
    });
  });

  it("retries a 5xx", () => {
    expect(answer(503, "")).toEqual({
      kind: "retry",
      error: "The Slack service had a problem on its side.",
    });
  });

  it("retries any other answer", () => {
    expect(answer(400, "invalid_payload")).toEqual({
      kind: "retry",
      error: "The Slack service did not accept the message.",
    });
  });

  it("starts every failure sentence with The Slack and ends it with a full stop", () => {
    for (const result of [
      answer(429),
      answer(500),
      answer(400, "x"),
      answer(404),
      answer(403, "no_service"),
    ]) {
      if (result.kind === "sent") throw new Error("unexpected");
      expect(result.error).toMatch(/^The Slack .*\.$/);
    }
  });
});
