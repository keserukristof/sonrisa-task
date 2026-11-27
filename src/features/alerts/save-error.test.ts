import { describe, expect, it } from "vitest";
import { saveAlertFailure } from "./save-error";

describe("saveAlertFailure", () => {
  it("tells the user about the 50 alert limit when creating", () => {
    expect(saveAlertFailure("23514", false)).toEqual({
      ok: false,
      message: "You've reached 50 alerts. Delete one to add another.",
    });
  });

  it("shows a missing destination as the destinations field error when editing", () => {
    expect(saveAlertFailure("23514", true)).toEqual({
      ok: false,
      fieldErrors: { destinationIds: "Choose at least one destination." },
    });
  });

  it("refuses a destination that is not the user's with the generic message", () => {
    expect(saveAlertFailure("23503", false)).toEqual({
      ok: false,
      message: "Couldn't save the alert. Nothing was changed. Try again.",
    });
  });

  it("falls back to the generic message for unknown failures", () => {
    expect(saveAlertFailure(undefined, true).message).toBe(
      "Couldn't save the alert. Nothing was changed. Try again.",
    );
  });
});
