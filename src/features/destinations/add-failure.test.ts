import { describe, expect, it } from "vitest";
import { addSlackFailure } from "./add-failure";

describe("addSlackFailure", () => {
  it("names the duplicate on the name field", () => {
    expect(addSlackFailure("23505", "x", "Ops channel")).toEqual({
      ok: false,
      fieldErrors: {
        name: "You already have a destination called Ops channel.",
      },
    });
  });

  it("reports the limit as a form error", () => {
    expect(addSlackFailure("P0001", "slack_destination_limit", "Ops")).toEqual({
      ok: false,
      message:
        "You have 10 Slack destinations, the most an account can have. Remove one before adding another.",
    });
  });

  it("maps a rejected URL to the URL field", () => {
    const result = addSlackFailure("22023", "bad url", "Ops");
    expect(result.fieldErrors?.url).toMatch(
      /^Paste a Slack incoming webhook URL/,
    );
  });

  it("falls back to a generic message", () => {
    expect(addSlackFailure("XX000", "boom", "Ops")).toEqual({
      ok: false,
      message: "Couldn't add the destination. Try again in a minute.",
    });
    expect(addSlackFailure("P0001", "something_else", "Ops").message).toMatch(
      /^Couldn't add/,
    );
  });
});
