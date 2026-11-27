import "server-only";
import { allowsLocalSlackStub, serverEnv } from "@/lib/env.server";
import type { Channel } from "@/lib/alerting/types";
import { slackSettingsSchema, type SlackSettings } from "./settings";

/**
 * Placeholder from the Contracts ticket (#17), registered with the tick so
 * no other ticket edits collaborators.ts. #18 replaces `send` and `sendTest`
 * with Block Kit rendering and outcome classification. The settings schema
 * stays: every stored URL is re-validated before anything is sent.
 */
export const slackChannel: Channel<SlackSettings> = {
  type: "slack",
  get settingsSchema() {
    return slackSettingsSchema({
      allowLocalStub: allowsLocalSlackStub(serverEnv()),
    });
  },
  async send() {
    return { kind: "retry", error: "The Slack channel is not built yet." };
  },
  async sendTest() {
    return { kind: "retry", error: "The Slack channel is not built yet." };
  },
};
