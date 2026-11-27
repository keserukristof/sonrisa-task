import { describe, expect, it } from "vitest";
import { describeTestResult } from "./test-result";

describe("describeTestResult for Slack", () => {
  it("shows the five-a-day limit as skipped", () => {
    expect(describeTestResult({ ok: false, code: "slack_test_limit" })).toEqual(
      {
        status: "skipped",
        label: "Not sent. You've sent 5 tests to this destination today.",
      },
    );
  });

  it("shows a permanent answer as failed with the reason", () => {
    expect(
      describeTestResult({
        ok: false,
        code: "broken",
        message: "Slack says this channel no longer exists.",
      }),
    ).toEqual({
      status: "failed",
      label: "Not delivered. Slack says this channel no longer exists.",
    });
  });
});

describe("describeTestResult", () => {
  it("shows nothing before a test", () => {
    expect(describeTestResult({ ok: true })).toBeNull();
  });

  it("shows the delivery time as sent", () => {
    expect(
      describeTestResult({ ok: true, message: "Delivered at 13:55 UTC" }),
    ).toEqual({ status: "sent", label: "Delivered at 13:55 UTC" });
  });

  it("shows each refusal as skipped with its reason", () => {
    expect(describeTestResult({ ok: false, code: "hourly_limit" })).toEqual({
      status: "skipped",
      label: "Not sent. You've reached 10 emails this hour.",
    });
    expect(describeTestResult({ ok: false, code: "daily_limit" })).toEqual({
      status: "skipped",
      label: "Not sent. Heads-up has reached its 80 emails for today.",
    });
    expect(describeTestResult({ ok: false, code: "test_limit" })).toEqual({
      status: "skipped",
      label: "Not sent. You've sent 3 tests today.",
    });
  });

  it("shows the system-wide test cap as skipped", () => {
    expect(
      describeTestResult({ ok: false, code: "system_test_limit" }),
    ).toEqual({
      status: "skipped",
      label: "Not sent. Heads-up has reached its 20 test emails for today.",
    });
  });

  it("shows any other failure as failed", () => {
    expect(describeTestResult({ ok: false, code: "failed" })).toEqual({
      status: "failed",
      label: "Couldn't send the test. Try again in a minute.",
    });
    expect(describeTestResult({ ok: false })).toEqual({
      status: "failed",
      label: "Couldn't send the test. Try again in a minute.",
    });
  });
});
