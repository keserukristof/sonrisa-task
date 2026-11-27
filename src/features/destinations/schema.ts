import { z } from "zod";
import { slackWebhookUrlField } from "@/lib/alerting/channels/slack/settings";

export const sendTestSchema = z.object({
  destinationId: z.uuid(),
});

export const removeDestinationSchema = z.object({
  destinationId: z.uuid(),
});

export const SLACK_NAME_MAX = 60;

/**
 * The "Add Slack destination" form. Whether the local stub's URL is accepted
 * depends on the environment, so the action passes `allowLocalStub` from
 * `allowsLocalSlackStub()`. Uniqueness of the name and the 10-destination cap
 * are the database's (`add_slack_destination`), which the action maps to
 * the messages in docs/design/screens/add-slack-destination.md.
 */
export function addSlackDestinationSchema(options: {
  allowLocalStub: boolean;
}) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a name.")
      .max(SLACK_NAME_MAX, `Use at most ${SLACK_NAME_MAX} characters.`),
    url: slackWebhookUrlField(options),
  });
}

export type AddSlackDestinationInput = z.infer<
  ReturnType<typeof addSlackDestinationSchema>
>;
export type AddSlackDestinationField = keyof AddSlackDestinationInput;
