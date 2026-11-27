# Admin lists: users, events, notifications

- **Routes:** `/admin/users`, `/admin/events`, `/admin/notifications` (with `?status=` and `?page=`).
- **Purpose:** let an admin see who uses the system, what came in, and where delivery fails. Read-only.
- **Primary action:** none.
- **Artboards:** [html/AdminUsers.dc.html](../html/AdminUsers.dc.html), [html/AdminEvents.dc.html](../html/AdminEvents.dc.html), [html/AdminNotifications.dc.html](../html/AdminNotifications.dc.html), [html/AdminNotificationsEmpty.dc.html](../html/AdminNotificationsEmpty.dc.html), [html/AdminListLoading.dc.html](../html/AdminListLoading.dc.html), [html/AdminListError.dc.html](../html/AdminListError.dc.html), [html/MobileAdminNotifications.dc.html](../html/MobileAdminNotifications.dc.html). Screenshots `2-admin-*.png`, `2-mobile-admin-notifications.png`.

## Shared rules

- The admin frame from [admin-overview.md](admin-overview.md): header, `h1` "Admin", tabs.
- Rows like notification history (decision log, 2026-11-27 18:29): one card, a header row in `muted-foreground` at desktop width, a grid per row, stacked rows below 640px with the header row hidden.
- 25 rows a page, newest first, with the shared Pager on `?page=`. Times in UTC. Emails unmasked. No search or sort controls.

## Users

Columns: **Email** (weight 600), **Role** (a chip: "Admin" or "User"), **Signed up** ("27 Nov 2026"), **Alerts** ("0 alerts", "1 alert", "12 alerts"). Newest sign-up first.

## Events

Columns:

- **Event**: the title at weight 600, with the Simulated badge when it applies; the event time in UTC under it.
- **Source and category**: the source's name ("U.S. Geological Survey", "The Guardian", "CoinGecko", "Simulated"), the category in `muted-foreground`, then the source credit in caption size: "U.S. Geological Survey", "Source: The Guardian", "Powered by CoinGecko". Simulated events have no credit.
- **Severity**: the SeverityMark.

Newest event time first.

## Notifications

- **Status filter**, above the card: the label "Status", then a Filter of five links: All, Pending, Sent, Failed, Skipped, each a link to `?status=<value>` (All drops the parameter). The current one has `aria-current="page"`. It works without JavaScript. An unknown value shows All as current. Changing the filter returns to page 1; the Pager keeps the filter.
- Columns:
  - **Event**: title, Simulated badge, event time.
  - **Owner and destination**: the owner's email, then "Email" or "Slack" in `muted-foreground`.
  - **Attempts**: "0 attempts", "1 attempt", "2 attempts".
  - **Status**: the NotificationStatus, with its reason or time under it, as in the user's history: the sent time, "Next attempt at 13:56 UTC", the skip reason, or the failure sentence ("The Slack …", "The email …").
- Newest first, by creation.

## States

- **Loading:** the frame and, for notifications, the filter render at once. The card shows three skeleton rows in the list's grid (`aria-busy="true"`, label "Loading users", "Loading events", "Loading notifications").
- **Empty:**
  - Users: cannot be empty (the admin is a user).
  - Events: "No events yet". "Events appear here when a source is polled or an admin simulates one." Link: "Simulate an event" (outline) to `/admin/simulate`.
  - Notifications, All: "No notifications yet". "They appear here once an alert matches an event."
  - Notifications, filtered: "No <status> notifications", e.g. "No failed notifications". "Nothing has failed. Choose All to see every notification." with "Show all" (outline). The sentence per status: Pending "Nothing is waiting to be sent.", Sent "Nothing has been sent yet.", Failed "Nothing has failed.", Skipped "Nothing has been skipped."
- **Error:** an error Notice in place of the card: "Couldn't load the users." / "Couldn't load the events." / "Couldn't load the notifications.", with "Try again".

## Responsive

Below 640px each row stacks in column order; the notifications row reads: title and time; owner email; "Slack · 2 attempts"; status and reason. The filter wraps onto two lines if it must. No horizontal scroll at 360px.

## Components

Header, Tabs, Filter, ListRow, SeverityMark, NotificationStatus, SimulatedBadge, Badge (role chip), EmptyState, Notice, Skeleton, Pager.
