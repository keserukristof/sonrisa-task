# Admin overview

- **Route:** `/admin`. Increment 1 redirected `/admin` to `/admin/simulate`; now `/admin` is this page.
- **Purpose:** show an admin whether the feeds are healthy and how much of today's email budget is used.
- **Primary action:** none. A read-only page.
- **Data:** the latest poll of each source (`source_polls`), the latest successful poll of each, today's email count and test-send count (`email_usage`, `test_sends`).
- **Artboards:** [html/AdminOverview.dc.html](../html/AdminOverview.dc.html), [html/AdminOverviewNotPolled.dc.html](../html/AdminOverviewNotPolled.dc.html), [html/MobileAdmin.dc.html](../html/MobileAdmin.dc.html). Screenshots `2-admin-overview.png`, `2-admin-overview-not-polled.png`, `2-mobile-admin.png`.

## The admin area: header and tabs

Every admin page (overview, Users, Events, Notifications, Simulate) shares this frame:

1. **App header**, "Admin" current. The header's Admin link now goes to `/admin`.
2. **Main**, at most 880px wide, 24px padding (16px at 360px):
   - The `h1` "Admin", 16px above the tabs. Every admin page has this same `h1`; the tab names the section.
   - **Tabs**: a `nav` with `aria-label="Admin"` holding five links: Overview (`/admin`), Users (`/admin/users`), Events (`/admin/events`), Notifications (`/admin/notifications`), Simulate (`/admin/simulate`). The current one has `aria-current="page"`, weight 600 and a 2px `primary` underline, like the header's navigation. They are links, not an ARIA tablist: each is its own route. 24px below the tabs.
   - At 360px the tab row scrolls sideways inside its own container; the page itself never scrolls sideways.
   - The page `<title>` names the section: "Admin: overview · Heads-up", "Admin: users · Heads-up".

- A non-admin gets the not-found page for every admin route, with one header and the title "Page not found" (increment 1 review, item 3).

See components.md, Tabs.

## Layout, top to bottom

1. The admin frame.
2. **Sources** (`h2`), 12px above a card:
   - A header row in `muted-foreground`: Source, Last poll, Events stored, Status.
   - One row per source, in this order: U.S. Geological Survey, The Guardian, CoinGecko.
     - **Source**: its name at weight 600, then "<Category>, every <interval>" in `muted-foreground`: "Earthquakes, every minute", "News, every 3 minutes", "Markets, every 5 minutes".
     - **Last poll**: the time of the latest poll ("18:47 UTC"; with the date when not today), then its outcome in `muted-foreground`: "Succeeded", or "Failed: " and the stored error sentence.
     - **Events stored**: how many new events that poll stored.
     - **Status**: one of three, each with text and an icon.
3. **Email budget** (`h2`), 32px below the sources, 12px above a padded card:
   - "**37 of 80** emails sent today (UTC)" at 16px, the numbers at weight 700.
   - A meter, 8px tall, filled in `foreground` to the share used. It has `role="img"` and the label "37 of 80 emails sent today". It turns no colour: the numbers carry the meaning.
   - "4 of 20 test sends" in `muted-foreground`.
   - A caption: Resets at 00:00 UTC. Over the budget, emails are skipped with the reason "Daily limit (80) reached".

## Source status

| Status  | Rule                                                                                                 | Style                |
| ------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| OK      | The last poll succeeded, and the last success is within three intervals                              | check, `success`     |
| Late    | The last successful poll is older than three intervals: USGS 3 minutes, the Guardian 9, CoinGecko 15 | clock, `warning`     |
| Failing | The last poll failed. Wins over Late. Its error shows in the Last poll column                        | cross, `destructive` |

A source never polled shows "Never polled" in the Last poll column, "—" for events, and the status Late.

## Not polled in this environment

When real polling is off (every environment but production), the Sources card holds only: "Not polled in this environment" at weight 600, then "Real polling is switched on only in production. Here, events come from simulation and recorded responses." in `muted-foreground`. The email budget still shows.

## States

- **Loading:** the frame renders. Each card shows skeleton rows: three source rows, and two lines plus a meter block for the budget.
- **Empty:** not applicable; the sources are fixed and the budget always has numbers (zero included: "0 of 80 emails sent today (UTC)").
- **Error:** each section fails on its own, with an error Notice in place of its card: "Couldn't load the source health." or "Couldn't load the email budget.", each with "Try again".

## Responsive

Below 640px each source row stacks: the name with the status on the right, then the category and interval, "Last poll 18:46 UTC", the outcome, and "N events stored" ("1 event stored"). The header row is hidden.

## Components

Header, Tabs, ListRow, Status, Meter, Notice, Skeleton.
