# Notification history

- **Route:** `/notifications`, with an optional `?page=<n>`.
- **Purpose:** let the user trust or debug their alerts: what was sent, what was not, and why.
- **Primary action:** none; it is a read-only view.
- **Data:** the user's notifications, newest first, 25 a page, each with its event, alert, destination and status.
- **Artboards:** [Notifications](../html/Notifications.dc.html), [NotificationsEmpty](../html/NotificationsEmpty.dc.html), [MobileNotifications](../html/MobileNotifications.dc.html)

## Layout, top to bottom

1. **App header**, "Notifications" current.
2. **Main**, at most 880px wide, centred, 24px padding:
   - The `h1` "Notifications", 24px above the content.
   - One card: a header row, then a `<ul>` with one row per notification.
   - The pager, 16px below the card, only when there is more than one page.
   - A credit line in `caption`, `muted-foreground`, 24px below.

## Columns

Four columns, the same grid on the header row and every row: `minmax(0, 2.2fr) minmax(0, 1.3fr) 120px 200px`, 16px apart, rows top-aligned.

| Column                | Line 1                                                             | Line 2, in `muted-foreground`            |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Event                 | The event title at weight 600, with the Simulated badge when it is | The event time: "27 Nov 2026, 13:42 UTC" |
| Alert and destination | The alert name, or "Deleted alert" in `muted-foreground`           | The destination name: "Account email"    |
| Severity              | The Severity mark with the event's level                           |                                          |
| Status                | The status: icon and word                                          | The detail for that status, below        |

The header row is `muted-foreground` at weight 500, padded 8px by 16px: Event; Alert and destination; Severity; Status.

## Status and its detail

| Status  | Icon and colour           | Detail line                                                                      |
| ------- | ------------------------- | -------------------------------------------------------------------------------- |
| Pending | clock, `muted-foreground` | "Next attempt at 13:56 UTC"; before the first attempt: "Waiting to be sent"      |
| Sent    | check, `success`          | The time it was sent: "13:43 UTC"                                                |
| Failed  | cross, `destructive`      | The reason in plain words: "The email provider didn't respond after 4 attempts." |
| Skipped | barred circle, `warning`  | "Hourly limit (10) reached" or "Daily system limit (80) reached"                 |

A failure reason is never a raw provider or database message. Map known errors to a sentence; anything else reads "The email couldn't be sent after 4 attempts."

## Simulated events

The Simulated badge (flask icon and the word, `warning-muted` with a `warning` outline) follows the title on the same line. Nothing else about the row differs.

## Copy

- **Heading:** Notifications
- **Pager:** Previous; Page <n>; Next
- **Credit:** Earthquake data: U.S. Geological Survey

## Pager

Plain links on `?page=`, as small outline buttons, inside `<nav aria-label="Pagination">`. "Previous" is not rendered on the first page and "Next" not on the last. A `page` that is not a positive whole number, or is past the last page, shows the first page.

## States

- **Loading:** the heading renders. The card shows the header row and three skeleton rows in the row's shape.
- **Empty:** the card holds the empty state, with no header row, pager or credit:
  - A mail icon, 24px, in `muted-foreground`.
  - Heading: No notifications yet
  - Text: They appear here once one of your alerts matches an event.
  - Link styled as an outline button: Go to alerts
- **Error:** an error Notice in place of the card: "Couldn't load your notifications." with "Try again".

## Responsive

Below 640px there is no header row, and each row stacks, 10px between its parts:

1. The title; the Simulated badge on its own line under the title; the time.
2. The Severity mark.
3. A two-column definition list: "Alert" and "Destination" as terms in `muted-foreground`, their values beside them.
4. The status and its detail.

The page padding is 16px. No horizontal scrolling at 360px.

## Components

Header, ListRow, Severity, Status, the Simulated badge, Pager, EmptyState, Skeleton, Notice.

## Increment 2: Slack, channel-named failures and credits

Artboard: [html/Notifications2.dc.html](../html/Notifications2.dc.html), screenshot `2-notifications2.png`. Everything above still holds unless this section changes it.

- **Destination** (second line of the "Alert and destination" column): "Account email" for email; "Slack · <name>" for Slack. A destination removed since shows its name as it was stored, with "Slack · " in front.
- **Failure reasons name their channel.** Every stored failure sentence starts "The email …" or "The Slack …" and ends with a full stop; history shows that sentence and nothing else. Slack examples:
  - The Slack channel no longer exists.
  - The Slack channel is archived.
  - The Slack webhook was removed or revoked.
  - The Slack workspace blocks this webhook.
  - The Slack workspace is no longer active.
  - The Slack destination was removed.
  - The Slack webhook didn't respond after 4 attempts.
  - The email reasons from increment 1 keep their wording: "The email provider didn't respond after 4 attempts."
- **Credits.** Each row carries its source's credit as a third line in the Event column, in `caption` size and `muted-foreground`, under the event time:
  - earthquakes: U.S. Geological Survey
  - news: Source: The Guardian
  - markets: Powered by CoinGecko
  - simulated events: no credit line.
    This replaces increment 1's single "Earthquake data: U.S. Geological Survey" line under the list, which is removed.
- **At 360px** the credit stays under the time, as the third line of the stacked row's first block.
