# #4: Increment 2: a user gets alerts in Slack and about news and markets, and an admin sees the system

- **State:** open
- **Opened:** 2026-11-27 11:21 UTC by keserukristof
- **Labels:** none
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/4

## Body

Part of #2. Increments 2 and 3 merged into this one on 2026-11-27, because increment 1 ran past the 17:30 checkpoint (plan of attack). #5 is closed into it.

## What ships

Slack incoming-webhook destinations with test and broken state, the Guardian and CoinGecko sources behind the interfaces increment 1 built, and a read-only admin view: users, events, notifications, source health and today's email budget, plus the reviewer admin login. This increment is the proof that a new channel and a new source do not change the alerting core.

## Spec user stories delivered

9. As a user, I want to add a Slack destination by pasting an incoming webhook URL and giving it a name, so that alerts can reach a channel my team already watches.
10. As a user, I want a webhook URL that does not point at Slack's own host to be refused with an explanation, so that I do not save something that will never work.
11. As a user, I want to see each Slack destination only by its name and a masked hint of its URL, so that the secret URL is never shown back in the browser.
12. As a user, I want to connect several Slack destinations, so that different alerts can go to different channels.
13. As a user, I want to send a test notification to any destination, so that I can check it works before relying on it.
14. As a user, I want to see the result of the test (delivered, or the reason it failed), so that I can fix a broken destination.
15. As a user, I want a Slack destination that Slack reports as gone (removed, archived, revoked) to be marked broken on my destinations screen, so that I know to replace it.
16. As a user, I want to remove a Slack destination, so that alerts stop going to a channel I no longer use.
34. As a user, I want a Slack notification with the same content formatted for Slack, so that it reads well in the channel.
41. As a user, I want news from the Guardian's world, business and environment sections to be available as events, so that I can be told about major stories.
42. As a user, I want crypto market movements of the top 20 coins by market cap to become events when a coin's 1-hour change crosses ±3%, so that I hear about sharp moves, not every price tick.
43. As a user, I want at most one market event per coin per 6 hours, so that a volatile coin does not repeat itself.
47. As a user, I want to see CoinGecko credited where market data is shown, as its terms require.
48. As an admin, I want an admin area that only admins can open, so that ordinary users never see other users' data.
49. As an admin, I want a list of all users with their email address, role, sign-up date and number of alerts, so that I can see who uses the system.
51. As an admin, I want a list of all events with their source, category, severity, time and whether they were simulated, so that I can see what came in.
52. As an admin, I want a list of all notifications with their status, destination type, attempts and failure reason, filterable by status, so that I can spot delivery problems.
53. As an admin, I want to see when each source was last polled and whether that poll succeeded, so that I know whether the feeds are healthy.
54. As an admin, I want to see how much of today's system-wide email budget has been used, so that I know whether emails are about to be skipped.
67. As a reviewer, I want an admin login handed over privately, so that I can see the admin area on the live site.
68. As any visitor, I want every page to work on a mobile width and to be usable with a keyboard and a screen reader, so that nobody is shut out.
69. As any visitor, I want every data view to show a loading state, an empty state and an error state, so that I always know what is happening.

## Notes

- Stories 13 and 14 extend to Slack destinations; for email they shipped in increment 1, as did story 20.
- Story 48 is partly in place from increment 1 (the admin gate and simulate); this increment adds the lists.
- **Dropped when the increments merged**, recorded in #2's Out of Scope: 17 (which alerts use a destination before removal), 50 (admin list of all alerts), 55–57 (promote and demote; admin stays granted by SQL).
- **Fallback, agreed in advance:** if Build has not started by 01:00 on 2026-11-28, cut in this order and no further: (1) CoinGecko, stories 42, 43 and 47; (2) the admin events list, 51; (3) source health, 53. Scope freezes at 05:30.
- **Phases:** Refine and Design run in parallel with the ship of increment 1. Slice and Contracts start once `increment-2` is cut from `main` after increment 1 merges.
- **Before ship, from the user:** a Guardian developer key, a CoinGecko Demo key, and a Slack workspace with one incoming webhook for the production evidence.

## Acceptance criteria

_Written in the Refine phase on 2026-11-27, from two grill rounds (14 decisions) recorded in `docs/process/decision-log.md`. Everything in #3's criteria still holds: the product is **Heads-up**, every time is in UTC and labelled "UTC", feedback is an inline notice. The implementation decisions in #2 (Slack's permanent error codes, the webhook host rule, the source mappers and thresholds, the data model) are not repeated here._

### Slack destinations (stories 9–16)

- **Add (9, 10, 12).** `/destinations` has "Add Slack destination": a name and a webhook URL.
  - Name: required, 1 to 60 characters, unique among the account's destinations.
  - URL: must be `https://hooks.slack.com/services/…`. Anything else is refused with "Paste a Slack incoming webhook URL. It starts with https://hooks.slack.com/services/."
  - Outside production only, `http://127.0.0.1:<port>/slack/…` is also accepted, for the local and e2e stub.
  - An account has at most 10 Slack destinations; the 11th is refused with a reason that names the limit.
- **Hint (11).** After saving, the URL is never shown or sent to the browser again. A row shows the name, "Slack" and the hint `hooks.slack.com/…/` plus the URL's last 4 characters.
- **Send test (13, 14).** Every destination row has "Send test", sent at once, with the result inline as for email.
  - Slack tests have their own limit: 5 per destination per UTC day, refused over it with a reason that names the limit. They use no email budget.
  - A permanent Slack answer marks the destination broken and shows a reason in our words, such as "Slack says this channel no longer exists." A transient failure shows "Couldn't send the test. Try again in a minute."
  - A successful test of a broken destination returns it to active.
- **Broken (15).** A broken destination shows "Broken" with its reason, by text and icon, not colour alone. It receives no new notifications. On `/alerts`, every alert that uses it shows that destination's name marked broken.
- **Remove (16).** A Slack row has "Remove", which opens a confirmation naming the destination.
  - Removal is refused when the destination is the only one some alert uses: "<name> is the only destination of N alerts. Change them first." (Story 17, listing every alert that uses it, was dropped.)
  - Pending notifications of a removed destination fail with "The Slack destination was removed."
- **Alert form.** Slack destinations appear as checkboxes beside "Account email", by name, with a broken mark where broken.

### Slack message (story 34)

- Block Kit: a header with the event title linking to the source, a section with the severity in words and the summary, and a context line with the alert's name and the source credit.
- A simulated event gets the `[SIMULATED]` prefix and a banner line, as in email.
- Slack has no rate limit of ours. A 429 honours `Retry-After`; transient failures retry at 1, 5 and 15 minutes, as for email.

### Sources (stories 41–43, 47)

- **News alerts need a keyword.** A news alert must have at least one keyword. The form says why: "News alerts need at least one keyword, or every article would notify you." The database enforces it, and existing news alerts with no keywords are paused by the migration.
- **The Guardian (41).** As in #2: world, business and environment sections; every article is a low-severity news event; polled every 3 minutes in production only.
- **CoinGecko (42, 43).** As in #2. An event reads:
  - Title: "Bitcoin (BTC) up 4.2% in the past hour", or "down 3.6%".
  - Summary: "Price $64,210. 24-hour change −1.8%." The price is in US dollars.
  - Link: the coin's CoinGecko page.
- **Credits (47).** One rule for every source, shown in four places: notification history rows, the admin events list, the email footer and the Slack context line. "U.S. Geological Survey" for earthquakes, "Source: The Guardian" for news, "Powered by CoinGecko" for markets.
- **Failure reasons name their channel.** Stored failure sentences start "The email …" or "The Slack …" and end with a period. History shows those and nothing else.
- Every source's mapper is unit-tested on recorded responses committed to the repository. No test calls a real feed.

### Admin view (stories 48, 49, 51–54, 67)

- **Navigation (48).** `/admin` is an overview. The admin area has tabs: Overview, Users, Events, Notifications, Simulate. A non-admin gets the not-found page for all of them, revealing nothing, as in increment 1.
- **Overview: source health (53).** One row per source: last poll time, outcome, error and events stored, and a status.
  - OK: the last poll succeeded.
  - Late: the last successful poll is older than three of its intervals (USGS 3 minutes, the Guardian 9, CoinGecko 15).
  - Failing: the last poll failed, shown with its error.
  - Each status has text and an icon. When real polling is off, the section says "Not polled in this environment".
- **Overview: email budget (54).** "N of 80 emails sent today (UTC)", with "M of 20 test sends" under it.
- **Lists (49, 51, 52).** 25 per page with the shared pager, newest first, times in UTC, emails unmasked, no search or sorting controls.
  - Users: email, role, sign-up date, number of alerts.
  - Events: title, source, category, severity, time, the Simulated badge, the source credit.
  - Notifications: event, owner's email, destination type, status, attempts, failure or skip reason. A status filter (All, Pending, Sent, Failed, Skipped) is kept in `?status=`; an unknown value shows All.
- **Reviewer login (67).** Nothing to build. The README says reviewers get an admin login privately. Admin is granted by SQL, and the SQL is written down for the user.

### Every screen (stories 68, 69)

- Works at 360px and at desktop width, by keyboard alone and with a screen reader, with no axe violations.
- Every data view handles loading, empty, error and success.
- Each new user-facing flow has a Playwright spec on both projects. The Slack paths, broken state included, are tested end to end against the stub.

