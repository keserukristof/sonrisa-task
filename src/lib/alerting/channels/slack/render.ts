import { formatUtcDateTime } from "@/lib/format";
import { sourceCredit } from "@/lib/alerting/sources/catalog";
import {
  SEVERITY_LABELS,
  type OutgoingNotification,
} from "@/lib/alerting/types";

type Mrkdwn = { type: "mrkdwn"; text: string };
export type SlackBlock =
  { type: "section"; text: Mrkdwn } | { type: "context"; elements: Mrkdwn[] };
export type SlackMessage = { text: string; blocks: SlackBlock[] };

const SIMULATED_BANNER =
  "_This is a simulated event created by an admin. Nothing happened._";

/** Slack's mrkdwn needs exactly these three escaped. */
function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** A URL goes inside `<url|text>`, so `|`, `<` and `>` must not appear in it. */
function linkUrl(url: string): string {
  return url
    .replaceAll("|", "%7C")
    .replaceAll("<", "%3C")
    .replaceAll(">", "%3E");
}

function section(text: string): SlackBlock {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function context(text: string): SlackBlock {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

export function renderAlertMessage(
  notification: OutgoingNotification,
): SlackMessage {
  const { event, alertName } = notification;
  const severity = SEVERITY_LABELS[event.severity];
  const title = event.simulated ? `[SIMULATED] ${event.title}` : event.title;

  const safeTitle = esc(title);
  const titleText = event.url
    ? `*<${linkUrl(event.url)}|${safeTitle}>*`
    : `*${safeTitle}*`;

  const summaryText = event.summary
    ? `*${severity}* · ${esc(event.summary)}`
    : `*${severity}*`;

  const credit = event.simulated
    ? "Simulated by an admin"
    : sourceCredit(event.source);
  const contextParts = [
    alertName ? `Alert: ${esc(alertName)}` : "Alert deleted",
    ...(credit ? [credit] : []),
  ];

  const blocks: SlackBlock[] = [section(titleText)];
  if (event.simulated) blocks.push(section(SIMULATED_BANNER));
  blocks.push(section(summaryText), context(contextParts.join(" · ")));

  const text = `${event.simulated ? "[SIMULATED] " : ""}[${severity}] ${esc(event.title)}${
    alertName ? ` · ${esc(alertName)}` : ""
  }`;
  return { text, blocks };
}

export function renderTestMessage(now: Date, appUrl: string): SlackMessage {
  const destinationsUrl = `${appUrl.replace(/\/+$/, "")}/destinations`;
  return {
    text: "This destination works",
    blocks: [
      section("_This destination works_"),
      section(
        `You sent this test from your destinations page on ${formatUtcDateTime(now).replace(", ", " at ")}. Notifications from your alerts arrive in this channel.`,
      ),
      context(
        `Heads-up · <${linkUrl(destinationsUrl)}|Manage your destinations>`,
      ),
    ],
  };
}
