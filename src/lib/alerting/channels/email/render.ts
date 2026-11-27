import { formatUtcDateTime } from "@/lib/format";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  type OutgoingNotification,
  type Severity,
} from "@/lib/alerting/types";

export type RenderedEmail = { subject: string; html: string; text: string };

// Emails are light-only: literal values of the light tokens.
const COLOR = {
  foreground: "#14262C",
  muted: "#52646B",
  primary: "#0D5C63",
  primaryForeground: "#FFFFFF",
  border: "#D3DDDD",
  warning: "#7A5600",
  warningMuted: "#FBF1D9",
} as const;

const SEVERITY_COLOR: Record<Severity, string> = {
  low: "#3F6485",
  moderate: "#8A6100",
  high: "#B8440F",
  critical: "#A3121A",
};

const FONT =
  "'Schibsted Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";

const SIMULATED_BANNER =
  "This is a simulated event created by an admin. Nothing happened.";
const USGS_CREDIT = "Data: U.S. Geological Survey.";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function base(appUrl: string): string {
  return appUrl.replace(/\/+$/, "");
}

function block(content: string, style = ""): string {
  return `<tr><td style="padding:8px 24px;${style}">${content}</td></tr>`;
}

function layout(blocks: string[], footer: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#F3F6F6;font-family:${FONT};color:${COLOR.foreground};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6F6;"><tr><td align="center" style="padding:16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#FFFFFF;border-radius:8px;font-family:${FONT};color:${COLOR.foreground};">
<tr><td style="padding:24px 24px 8px;font-size:16px;font-weight:700;">Heads-up</td></tr>
${blocks.join("\n")}
<tr><td style="padding:16px 24px 24px;"><div style="border-top:1px solid ${COLOR.border};padding-top:12px;font-size:12px;line-height:18px;color:${COLOR.muted};">${footer}</div></td></tr>
</table></td></tr></table></body></html>`;
}

export function renderAlertEmail(
  notification: OutgoingNotification,
  appUrl: string,
): RenderedEmail {
  const { event, alertName } = notification;
  const severity = SEVERITY_LABELS[event.severity];
  const category = CATEGORY_LABELS[event.category];
  const when = formatUtcDateTime(event.occurredAt);
  const alertsUrl = `${base(appUrl)}/alerts`;
  const credit = !event.simulated && event.source === "usgs";

  const subject = `${event.simulated ? "[SIMULATED] " : ""}[${severity}] ${event.title}${
    alertName ? ` · ${alertName}` : ""
  }`;

  const reason = alertName
    ? `You get this email because your alert "${alertName}" matched.`
    : "You get this email because one of your alerts matched.";

  const facts: [string, string][] = [
    ["Category", category],
    ["Severity", severity],
    ["When", when],
  ];
  if (alertName) facts.push(["Alert", alertName]);

  const rows = facts
    .map(([term, value]) => {
      const style =
        term === "Severity"
          ? `color:${SEVERITY_COLOR[event.severity]};font-weight:600;`
          : "";
      return `<tr><td style="padding:2px 16px 2px 0;font-size:14px;color:${COLOR.muted};">${term}</td><td style="padding:2px 0;font-size:14px;${style}">${esc(value)}</td></tr>`;
    })
    .join("");

  const blocks: string[] = [];
  if (event.simulated) {
    blocks.push(
      block(
        `<div style="background:${COLOR.warningMuted};border:1px solid ${COLOR.warning};border-radius:5px;padding:10px 12px;font-size:14px;color:${COLOR.warning};">${SIMULATED_BANNER}</div>`,
      ),
    );
  }
  blocks.push(
    block(
      `<div style="font-size:18px;font-weight:600;line-height:24px;">${esc(event.title)}</div>`,
    ),
  );
  if (event.summary) {
    blocks.push(
      block(
        `<div style="font-size:14px;line-height:20px;">${esc(event.summary)}</div>`,
      ),
    );
  }
  blocks.push(
    block(
      `<table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>`,
    ),
  );
  if (event.url) {
    blocks.push(
      block(
        `<a href="${esc(event.url)}" style="display:inline-block;background:${COLOR.primary};color:${COLOR.primaryForeground};border-radius:5px;height:36px;line-height:36px;padding:0 16px;font-size:14px;font-weight:600;text-decoration:none;">View at source</a>`,
      ),
    );
  }

  const footerHtml = `${credit ? `${USGS_CREDIT} ` : ""}${esc(reason)} <a href="${esc(alertsUrl)}" style="color:${COLOR.primary};">Manage your alerts</a>`;

  const textLines: string[] = [];
  if (event.simulated) textLines.push(SIMULATED_BANNER, "");
  textLines.push(event.title);
  if (event.summary) textLines.push("", event.summary);
  textLines.push("", ...facts.map(([term, value]) => `${term}: ${value}`));
  if (event.url) textLines.push("", event.url);
  textLines.push(
    "",
    `${credit ? `${USGS_CREDIT} ` : ""}${reason}`,
    `Manage your alerts: ${alertsUrl}`,
  );

  return {
    subject,
    html: layout(blocks, footerHtml),
    text: textLines.join("\n"),
  };
}

export function renderTestEmail(now: Date, appUrl: string): RenderedEmail {
  const destinationsUrl = `${base(appUrl)}/destinations`;
  const sentOn = formatUtcDateTime(now).replace(", ", " at ");
  const paragraph = `You sent this test from your destinations page on ${sentOn}. Notifications from your alerts arrive at this address.`;

  const blocks = [
    block(
      `<div style="font-size:18px;font-weight:600;line-height:24px;">This destination works</div>`,
    ),
    block(`<div style="font-size:14px;line-height:20px;">${paragraph}</div>`),
  ];

  return {
    subject: "Test from Heads-up",
    html: layout(
      blocks,
      `<a href="${esc(destinationsUrl)}" style="color:${COLOR.primary};">Manage your destinations</a>`,
    ),
    text: [
      "This destination works",
      "",
      paragraph,
      "",
      `Manage your destinations: ${destinationsUrl}`,
    ].join("\n"),
  };
}
