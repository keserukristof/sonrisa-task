import { describe, expect, it } from "vitest";
import { slackHint, slackSettingsSchema } from "./settings";

describe("slackSettingsSchema", () => {
  it("re-validates a stored URL, so the stub is refused in production", () => {
    const stored = { url: "http://127.0.0.1:4100/slack/demo-ops" };
    expect(
      slackSettingsSchema({ allowLocalStub: false }).safeParse(stored).success,
    ).toBe(false);
    expect(
      slackSettingsSchema({ allowLocalStub: true }).safeParse(stored).success,
    ).toBe(true);
  });
});

describe("slackHint", () => {
  it("shows Slack's host and the URL's last 4 characters", () => {
    expect(
      slackHint("https://hooks.slack.com/services/T000/B000/abcdWXYZ"),
    ).toBe("hooks.slack.com/…/WXYZ");
  });
});
