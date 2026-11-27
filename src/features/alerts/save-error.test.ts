import { describe, expect, it } from "vitest";
import { NEWS_NEEDS_KEYWORDS } from "./schema";
import { resumeAlertFailure, saveAlertFailure } from "./save-error";

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

const NEWS_CHECK =
  'new row for relation "alerts" violates check constraint "alerts_news_needs_keywords"';

describe("saveAlertFailure for the news rule", () => {
  it("shows the news rule under Keywords, creating or editing", () => {
    for (const editing of [false, true]) {
      expect(saveAlertFailure("23514", editing, NEWS_CHECK)).toEqual({
        ok: false,
        fieldErrors: { keywords: NEWS_NEEDS_KEYWORDS },
      });
    }
  });

  it("still reads another check violation as the missing destination", () => {
    expect(
      saveAlertFailure(
        "23514",
        true,
        "An alert needs at least one destination",
      ),
    ).toEqual({
      ok: false,
      fieldErrors: { destinationIds: "Choose at least one destination." },
    });
  });
});

describe("resumeAlertFailure", () => {
  it("explains a keyword-less news alert and where to fix it", () => {
    expect(resumeAlertFailure("23514", NEWS_CHECK, true)).toEqual({
      ok: false,
      message: `${NEWS_NEEDS_KEYWORDS} Edit the alert to add one.`,
    });
  });

  it("uses the plain message for any other failure", () => {
    expect(resumeAlertFailure("42501", "denied", true).message).toBe(
      "Couldn't resume the alert. Try again.",
    );
    expect(resumeAlertFailure("23514", NEWS_CHECK, false).message).toBe(
      "Couldn't pause the alert. Try again.",
    );
  });
});
