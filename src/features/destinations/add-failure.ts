import type { ActionResult } from "@/lib/action-result";
import { SLACK_URL_MESSAGE } from "@/lib/alerting/channels/slack/settings";

export type AddSlackField = "name" | "url";

const GENERIC = "Couldn't add the destination. Try again in a minute.";
const LIMIT =
  "You have 10 Slack destinations, the most an account can have. Remove one before adding another.";

/** Maps a failed `add_slack_destination` call to what the form shows. */
export function addSlackFailure(
  code: string | undefined,
  message: string | undefined,
  name: string,
): Extract<ActionResult<AddSlackField>, { ok: false }> {
  if (code === "23505") {
    return {
      ok: false,
      fieldErrors: { name: `You already have a destination called ${name}.` },
    };
  }
  if (code === "P0001" && message === "slack_destination_limit") {
    return { ok: false, message: LIMIT };
  }
  if (code === "22023") {
    return { ok: false, fieldErrors: { url: SLACK_URL_MESSAGE } };
  }
  return { ok: false, message: GENERIC };
}
