import type { Route } from "next";

/**
 * Success notices that have to survive a redirect. An action redirects to
 * `withNotice("/alerts", "alert-created")`; the destination page renders
 * `<FlashNotice>` with its `searchParams`. Only these keys are ever shown, so
 * the query string cannot be used to put arbitrary text on a page.
 */
export const NOTICES = {
  "email-confirmed": "Email confirmed.",
  "alert-created": "Alert created.",
  "changes-saved": "Changes saved.",
  "alert-deleted": "Alert deleted.",
  "slack-destination-added":
    "Slack destination added. Send a test to check it works.",
  "slack-destination-removed": "Slack destination removed.",
} as const;

export type NoticeKey = keyof typeof NOTICES;

export function isNoticeKey(value: unknown): value is NoticeKey {
  return typeof value === "string" && Object.hasOwn(NOTICES, value);
}

/** `path` with the notice added to its query string. */
export function withNotice(path: Route, notice: NoticeKey): Route {
  // A known route plus a fixed query key: still a route of this site.
  return `${path}${path.includes("?") ? "&" : "?"}notice=${notice}` as Route;
}
