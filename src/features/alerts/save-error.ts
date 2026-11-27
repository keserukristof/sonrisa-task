import type { ActionResult } from "@/lib/action-result";
import { NEWS_NEEDS_KEYWORDS, type AlertField } from "./schema";

const GENERIC = "Couldn't save the alert. Nothing was changed. Try again.";
const NEWS_CONSTRAINT = "alerts_news_needs_keywords";

function isNewsRule(code: string | undefined, message: string | undefined) {
  return code === "23514" && (message ?? "").includes(NEWS_CONSTRAINT);
}

/**
 * Maps a failed `save_alert` call to what the form shows. `23514` is either
 * the news keyword rule (told apart by its constraint name), the 50-alert
 * limit on create, or, on edit, the destinations.
 */
export function saveAlertFailure(
  code: string | undefined,
  editing: boolean,
  message?: string,
): Extract<ActionResult<AlertField>, { ok: false }> {
  if (isNewsRule(code, message)) {
    return { ok: false, fieldErrors: { keywords: NEWS_NEEDS_KEYWORDS } };
  }
  if (code === "23514") {
    return editing
      ? {
          ok: false,
          fieldErrors: {
            destinationIds: "Choose at least one destination.",
          },
        }
      : {
          ok: false,
          message: "You've reached 50 alerts. Delete one to add another.",
        };
  }
  return { ok: false, message: GENERIC };
}

/** Maps a failed pause or resume to the message above the list. */
export function resumeAlertFailure(
  code: string | undefined,
  message: string | undefined,
  active: boolean,
): { ok: false; message: string } {
  if (active && isNewsRule(code, message)) {
    return {
      ok: false,
      message: `${NEWS_NEEDS_KEYWORDS} Edit the alert to add one.`,
    };
  }
  return {
    ok: false,
    message: `Couldn't ${active ? "resume" : "pause"} the alert. Try again.`,
  };
}
