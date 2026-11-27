import type { ActionResult } from "@/lib/action-result";
import type { AlertField } from "./schema";

const GENERIC = "Couldn't save the alert. Nothing was changed. Try again.";

/**
 * Maps a failed `save_alert` call to what the form shows. `23514` means the
 * 50-alert limit on create; on edit the only check left is the destinations.
 */
export function saveAlertFailure(
  code: string | undefined,
  editing: boolean,
): Extract<ActionResult<AlertField>, { ok: false }> {
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
