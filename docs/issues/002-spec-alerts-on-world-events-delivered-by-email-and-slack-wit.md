# #2: Spec: alerts on world events, delivered by email and Slack, with an admin view

- **State:** open
- **Opened:** 2026-11-27 11:16 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/2

## Body

Source of every decision below: the phase 1 grill, recorded row by row in `docs/process/decision-log.md`. Vocabulary: `GLOSSARY.md`. Architecture: ADR-0001, ADR-0002, ADR-0003 in `docs/adr/`. Everything in this spec is Must; what was not agreed is under Out of Scope.

## Problem Statement

People want to know when something important happens in the world, such as a strong earthquake, a sharp market move or a major news story, without watching the news all day. What counts as important differs from person to person, and so does where they want to hear about it: some want an email, others want a message in a Slack channel they already watch. Today they have no single place to say "tell me about this, there".

The people running the service also need to see what it is doing: who is signed up, which alerts exist, which events came in, and whether notifications reached their destinations. They also need a way to prove the whole path works without waiting hours for the world to cooperate.

## Solution

A web application where a user signs up with email and password, connects destinations (their own account email address, and any number of Slack incoming webhooks), and sets up alerts. An alert says which category of event matters (news, markets, natural disasters), the minimum severity, optional keywords, and which of the user's destinations to notify.

Three real sources feed events: the Guardian Open Platform for news, CoinGecko for crypto market movements, and USGS for earthquakes. Each source's own measure is mapped onto one common four-level severity scale. Every minute, a scheduled tick polls the sources that are due, stores new events, matches them against alerts, and sends notifications, with retries and limits that keep the shared email quota from running out.

Users see their own notification history and the status of each notification. Admins see the whole system read-only, can promote and demote other admins, and can create a simulated event that goes through exactly the same path as a real one.

Channels are built behind one interface so a third channel is a new adapter and a new destination form, not a change to the alerting core.

## User Stories

### Account

1. As a visitor, I want to sign up with my email address and a password, so that I can set up my own alerts.
2. As a visitor, I want to confirm my email address through a link sent to it, so that nobody can create an account that makes the system email me without my consent.
3. As a visitor whose confirmation email has not arrived, I want to see that my account is waiting for confirmation, so that I know why I cannot sign in yet.
4. As a user, I want to sign in with my email address and password, so that I can manage my alerts.
5. As a user, I want to see a clear error when my email or password is wrong, so that I can correct it.
6. As a user, I want to sign out, so that nobody else on this device can use my account.
7. As a signed-out visitor, I want any page that needs an account to send me to sign in, so that I never see a broken page.

### Destinations

8. As a user, I want my account email address to be available as a destination without any setup, so that I can create an email alert straight away.
9. As a user, I want to add a Slack destination by pasting an incoming webhook URL and giving it a name, so that alerts can reach a channel my team already watches.
10. As a user, I want a webhook URL that does not point at Slack's own host to be refused with an explanation, so that I do not save something that will never work.
11. As a user, I want to see each Slack destination only by its name and a masked hint of its URL, so that the secret URL is never shown back in the browser.
12. As a user, I want to connect several Slack destinations, so that different alerts can go to different channels.
13. As a user, I want to send a test notification to any destination, so that I can check it works before relying on it.
14. As a user, I want to see the result of the test (delivered, or the reason it failed), so that I can fix a broken destination.
15. As a user, I want a Slack destination that Slack reports as gone (removed, archived, revoked) to be marked broken on my destinations screen, so that I know to replace it.
16. As a user, I want to remove a Slack destination, so that alerts stop going to a channel I no longer use.
17. As a user, I want to be told which alerts use a destination before I remove it, so that I do not silently leave an alert without destinations.

### Alerts

18. As a user, I want to create an alert by choosing a category (news, markets or natural disasters), so that I hear only about the kind of thing I care about.
19. As a user, I want to set a minimum severity for markets and natural disasters alerts, so that only events important enough to me notify me.
20. As a user creating a news alert, I want the severity choice to be disabled with an explanation, so that I cannot create a news alert that would never fire.
21. As a user, I want to add optional keywords to an alert, so that I hear only about events that mention them.
22. As a user, I want to choose one or more of my destinations for each alert, so that each alert reaches the right place.
23. As a user, I want an alert without any destination to be refused, so that I never set up an alert that tells nobody.
24. As a user, I want to give each alert a name, so that I can tell my alerts apart and recognise them in notifications.
25. As a user, I want to see all my alerts with their category, severity, keywords, destinations and whether they are active, so that I know what I am covered for.
26. As a new user with no alerts, I want an empty state that explains what an alert is and how to create one, so that I know where to start.
27. As a user, I want to edit an alert, so that I can adjust it without starting over.
28. As a user, I want to pause and resume an alert, so that I can stop notifications for a while without losing the alert.
29. As a user, I want to delete an alert, so that it stops notifying me for good.
30. As a user, I want a new alert to match only events that arrive after I create it, so that I am not flooded with yesterday's events.
31. As a user, I want form errors shown next to the field they concern, so that I can fix them quickly.

### Notifications

32. As a user, I want one notification per matching event per destination, so that I am told once, not repeatedly.
33. As a user, I want an email notification to say what happened, its category and severity, when, which alert matched, and a link to the source, so that I can act on it.
34. As a user, I want a Slack notification with the same content formatted for Slack, so that it reads well in the channel.
35. As a user, I want notifications to arrive within a few minutes of the source reporting the event, so that they are still useful.
36. As a user, I want a failed send to be retried a few times before it is given up, so that a brief outage does not lose my notification.
37. As a user, I want to see my notification history with the event, the alert, the destination, the status (pending, sent, failed, skipped) and the reason for any failure or skip, so that I can trust or debug my alerts.
38. As a user, I want at most 10 alert emails an hour, with the rest recorded as skipped, so that a broad alert cannot bury my inbox.
39. As a user, I want a notification skipped because a system limit was reached to say so in my history, so that I am not left wondering.
40. As a user with no notifications yet, I want an empty state that says notifications will appear here once an alert matches, so that an empty list does not look broken.

### Events and sources

41. As a user, I want news from the Guardian's world, business and environment sections to be available as events, so that I can be told about major stories.
42. As a user, I want crypto market movements of the top 20 coins by market cap to become events when a coin's 1-hour change crosses ±3%, so that I hear about sharp moves, not every price tick.
43. As a user, I want at most one market event per coin per 6 hours, so that a volatile coin does not repeat itself.
44. As a user, I want earthquakes of magnitude 4.5 and above to be available as events, so that I can be told about significant ones.
45. As a user, I want each event's severity to be shown on one common four-level scale, so that I can compare events across categories.
46. As a user, I want the same event reported twice by a source to produce one event, so that I am not notified twice.
47. As a user, I want to see CoinGecko credited where market data is shown, as its terms require.

### Admin

48. As an admin, I want an admin area that only admins can open, so that ordinary users never see other users' data.
49. As an admin, I want a list of all users with their email address, role, sign-up date and number of alerts, so that I can see who uses the system.
50. As an admin, I want a list of all alerts across users, so that I can see what people care about.
51. As an admin, I want a list of all events with their source, category, severity, time and whether they were simulated, so that I can see what came in.
52. As an admin, I want a list of all notifications with their status, destination type, attempts and failure reason, filterable by status, so that I can spot delivery problems.
53. As an admin, I want to see when each source was last polled and whether that poll succeeded, so that I know whether the feeds are healthy.
54. As an admin, I want to see how much of today's system-wide email budget has been used, so that I know whether emails are about to be skipped.
55. As an admin, I want to promote a user to admin, so that someone else can help run the system.
56. As an admin, I want to demote another admin, so that access can be taken away.
57. As an admin, I want to be unable to demote myself, so that the system can never be left without an admin.
58. As an admin, I want to create a simulated event by choosing its category, severity, title and optional details, so that I can prove the whole path works in seconds.
59. As an admin, I want a simulated event to be marked as simulated everywhere it appears, including in the notification, so that nobody mistakes it for a real event.
60. As an admin, I want a simulated event to go through exactly the same matching, limits and delivery as a real one, so that a successful simulation proves the real path.

### Operations and reviewers

61. As the operator, I want sources and delivery to run every minute without anyone visiting the site, so that alerts work around the clock.
62. As the operator, I want alert emails to stop at 80 a day across the system, keeping 20 of the provider's 100 for sign-up confirmations, so that new users can always confirm their address.
63. As the operator, I want only the production deployment to poll real sources, so that local development and tests cannot use up the production keys' quotas.
64. As the operator, I want the scheduled call to be authenticated with a secret that can do nothing except start a tick, so that a leaked secret cannot open the database.
65. As a developer, I want local development to work with recorded source responses and simulated events, so that I need no keys to run the app.
66. As a developer, I want emails sent locally to land in the local mail catcher, so that I can see them without a provider.
67. As a reviewer, I want an admin login handed over privately, so that I can see the admin area on the live site.
68. As any visitor, I want every page to work on a mobile width and to be usable with a keyboard and a screen reader, so that nobody is shut out.
69. As any visitor, I want every data view to show a loading state, an empty state and an error state, so that I always know what is happening.

## Implementation Decisions

### Architecture

- Next.js 16 and Supabase only (ADR-0001, ADR-0002). There is no separate backend service.
- **The alerting core** is a module that imports nothing from the Next.js framework. Its public entry point is a single `runTick` function that runs one cycle. It receives its collaborators: the database client, the registered sources, the registered channels, the clock, and the configuration (limits, intervals). The route the scheduler calls only checks the tick secret, builds those collaborators and calls `runTick`.
- **Scheduler** (ADR-0003). `pg_cron` runs every minute and calls the tick route through `pg_net`. The route authenticates with its own tick secret, compared in constant time. The tick secret is never the Supabase secret key. The job is created in a migration and reads the URL and secret from Supabase Vault, so each environment sets its own. The `net` schema, whose request queue stores headers, cannot be restricted from a migration: its grants belong to a role migrations cannot act as. It is protected by not being exposed through the API, which a test checks, and by the narrow tick secret (ADR-0003 addendum).
- **A tick is safe to repeat and to overlap.** Each step claims its work with row locks that skip already-locked rows, and every write is idempotent through unique constraints. The API client cannot lock rows, so the two steps that need it, matching with limits and claiming notifications for delivery, are database functions that only the tick may call. A tick that runs out of time leaves unfinished work for the next one.

### Tick steps

1. **Poll.** For each source whose interval has passed since its last poll (Guardian every 3 minutes, CoinGecko every 5, USGS every minute), fetch, map to events and store them. Each poll's time, outcome and error are recorded for the admin's source health view. A source that fails does not stop the others. Real polling is switched on only by configuration present in production; elsewhere sources are not polled.
2. **Match.** For each event not yet matched, find active alerts where all of these hold:
   - the category is equal;
   - the event's severity is at or above the alert's minimum;
   - every keyword appears in the event's title or summary, case-insensitive;
   - the alert was created before the event was ingested.

   For each such alert, create one notification per destination the alert uses. Unique on event and destination, so a user with two alerts on the same destination gets one notification.
3. **Limit.** Before an email notification becomes sendable, check the user's count for the last hour (10) and the system's count for the current UTC day (80). Over either, it is recorded as skipped with the limit as its reason. Slack has no limit of ours.
4. **Deliver.** Send pending notifications whose next attempt time has passed, through the channel adapter for their destination's type.
   - A transient failure (network, 5xx, 429) is retried at 1, 5 and 15 minutes, then marked failed. A 429 honours `Retry-After`.
   - A permanent failure marks the notification failed at once and the destination broken. For Slack that is `no_service`, `channel_not_found`, `channel_is_archived`, `action_prohibited`, `invalid_token`, `team_disabled` or `no_active_hooks`, or a 404 or 410.

### Sources

- A **Source** interface: an identifier, a category, a polling interval, and a function that fetches and returns normalised event candidates. Each candidate has: external id, title, summary, URL, occurred-at, severity, and raw payload.
- Each source's mapper is a pure function from the provider's response to candidates. It is separate from the fetch so it can be tested on recorded responses.
- **USGS earthquakes.**
  - Feed: the GeoJSON summary feed for magnitude 4.5 and above over the past hour or day.
  - External id: the USGS event id.
  - Severity from magnitude: 4.5 to 5.4 is low, 5.5 to 6.4 moderate, 6.5 to 7.4 high, 7.5 and above critical. A PAGER alert of orange or red raises it to at least high.
  - Credit "U.S. Geological Survey" where events are shown.
- **Guardian Open Platform.**
  - Sections: world, business, environment.
  - Every article becomes an event at severity low.
  - External id: the Guardian content id.
  - Needs the Guardian key.
- **CoinGecko.**
  - One batched markets call for the top 20 coins by market cap, with 1-hour change included.
  - An event is created when the absolute 1-hour change is 3% or more and that coin has no market event in the last 6 hours.
  - Severity from the absolute change: 3% to 5% is low, 5% to 8% moderate, 8% to 12% high, above 12% critical.
  - External id: coin id plus the hour window.
  - Needs the Demo key, sent in CoinGecko's demo header.
  - "Powered by CoinGecko" is shown wherever market events are listed.
- **Severity** is an enumeration with four ordered levels: `low`, `moderate`, `high`, `critical`.
- **Category** is an enumeration: `news`, `markets`, `natural_disasters`.
- Events are unique on source and external id.
- A **simulated event** is stored as an event of a reserved `simulated` source and flagged as simulated. It carries the category and severity the admin chose and enters the same Match step.

### Channels

- A **Channel** interface. Each channel has:
  - its type;
  - a Zod schema for the destination settings it needs;
  - a function that renders a notification for this channel and sends it;
  - a function that sorts a send outcome into sent, retry or permanently broken.
- Adding a channel means a new adapter, a new settings schema and a destination form; the alerting core does not change.
- **Email channel.** Uses Resend in production with a verified sender domain. Locally it sends to the local mail catcher over SMTP. The recipient is always the account's own email address, read when sending, never stored in destination settings.
- **Slack channel.** Posts a Block Kit message to the incoming webhook URL. Settings are a URL whose host must be Slack's hooks host over HTTPS.
- **Every user has exactly one email destination**, created automatically when their account is created, and it cannot be removed.

### Data model

Each table enables Row Level Security in the migration that creates it.

- **profiles**
  - Fields: user id, email (copied from auth on sign-up), role (`user` or `admin`), created at.
  - A user reads their own profile.
  - An admin reads all profiles.
  - Only a security-definer function changes roles. It checks that the caller is an admin and is not changing their own role.
- **destinations**
  - Fields: id, owner, channel type, name, settings (JSON validated by the channel's schema), masked hint, status (`active` or `broken`), broken reason, created at.
  - The settings column is not selectable by `anon` or `authenticated` (column privileges). The browser reads only the name, hint and status.
  - Writes go through Server Actions that validate the settings and compute the hint.
- **alerts**
  - Fields: id, owner, name, category, minimum severity (null for news), keywords (text array), active, created at, updated at.
  - The owner has full access to their own alerts. An admin can read all alerts.
- **alert_destinations**
  - The join between alerts and destinations.
  - Both must belong to the same owner, enforced in the database.
- **events**
  - Fields: id, source, external id, category, severity, title, summary, URL, occurred at, ingested at, simulated flag, raw payload.
  - Signed-in users can read events. Only the tick (secret key) and admins can write, admins only through the simulate function.
- **notifications**
  - Fields: id, event, alert, destination, owner, status (`pending`, `sent`, `failed`, `skipped`), attempts, next attempt at, last error, skip reason, sent at, created at.
  - Unique on event and destination.
  - The owner reads their own notifications; an admin reads all. Only the tick writes.
- **source_polls**
  - Fields: source, polled at, outcome, error, events stored.
  - Only admins read it.
- **Admin checks** in policies use one stable security-definer function that reads the caller's role from profiles.
- **The first admin** is set by SQL. In production the user grants their own account; the local seed creates a demo user and a demo admin.

### Application

- **Routes:**
  - sign up
  - sign in
  - waiting for confirmation
  - alerts: list, new, edit
  - destinations
  - notifications
  - admin: overview, users, alerts, events, notifications, simulate
  - the tick route
- Authenticated pages call a `requireUser` guard. Admin pages call a `requireAdmin` guard.
- **Every mutation is a Server Action.** Each one re-checks the user (and the admin role where needed) and validates with a Zod schema shared with its form.
- **Every page renders request-time data inside `<Suspense>`** and handles loading, empty, error and success.
- **Sign-up confirms the email address** through Supabase Auth, sending through Resend's SMTP in production. Password reset is not offered.
- **Environment.** Server-only variables are validated by a schema separate from the public one:
  - Supabase secret key
  - tick secret
  - Resend key and sender address
  - Guardian key
  - CoinGecko key
  - the flag that enables real polling

  A server-only admin client uses the secret key and is used only by the tick route.

## Testing Decisions

- **A good test checks behaviour through a public interface, not implementation details.** It sets up its own data with unique names, asserts on literal expected values, and never asserts on totals that other parallel tests can change. Tests never call real sources or real channels.
- **The tick seam (main).** Integration tests call `runTick` against the real local database, with fake sources, fake channels and a controllable clock. They cover:
  - matching on category, severity and keywords;
  - alerts not matching events ingested before they were created;
  - paused alerts not matching;
  - one notification per event and destination across overlapping alerts;
  - the hourly per-user and daily system-wide email limits producing skipped notifications;
  - the retry schedule and final failure;
  - a permanent Slack failure marking the destination broken;
  - a source failure not stopping other sources;
  - two ticks run back to back, or concurrently, sending each notification once;
  - simulated events taking the same path;
  - sources being polled only when their interval has passed and polling is enabled.
- **Source mappers.** Pure unit tests on recorded responses from USGS, the Guardian and CoinGecko. They cover:
  - severity boundaries;
  - the PAGER raise;
  - the ±3% threshold;
  - the 6-hour suppression (given the last event time);
  - external ids;
  - malformed items being skipped, not throwing.
- **Channel adapters.** Unit tests of rendering and of outcome classification (sent, retry, broken) on literal response examples. Slack URL validation is tested through the settings schema.
- **Zod schemas.** Unit tests for the alert, destination and simulate forms, covering:
  - an alert needs a destination;
  - news has no severity;
  - a Slack URL must be on Slack's host.
- **Row Level Security with pgTAP**, the first pgTAP tests in the repository. They cover:
  - a user cannot read or change another user's alerts, destinations or notifications;
  - nobody signed in can read destination settings;
  - an alert cannot link another user's destination;
  - only admins read all rows and source polls;
  - only admins can simulate or change roles;
  - an admin cannot change their own role.
- **Playwright end to end, one spec per feature**, each with an axe scan:
  - sign up and sign in;
  - create, edit, pause and delete an alert;
  - add a Slack destination and send a test;
  - the admin simulating an event and seeing the resulting notification as sent, with the tick run against the local stack and local channels.
- **Prior art to follow.** The unit tests in the health feature (`health-status.test.ts`) and the Playwright smoke test with its axe scan.

## Out of Scope

- Slack apps with OAuth ("Add to Slack"); only pasted incoming webhooks.
- Email to addresses other than the user's own account address.
- Password reset, account deletion, changing the account email address.
- Teams, organisations and shared alerts.
- Admin operations beyond simulation: retrying notifications, pausing other users' alerts, disabling users, editing anything of another user's. Promoting and demoting admins (stories 55–57) was cut on 2026-11-27 when increments 2 and 3 merged: admin is granted by SQL, as for the reviewer login.
- An admin list of all users' alerts (story 50), cut when increments 2 and 3 merged: the users list shows each user's number of alerts.
- Telling the user which alerts use a destination before it is removed (story 17), cut when increments 2 and 3 merged: the remove confirmation names the destination, and alerts keep their other destinations.
- Masking email addresses in the admin lists.
- Equities, forex or any market data beyond the top 20 crypto coins.
- Natural disasters other than earthquakes (no cyclones, floods, volcanoes).
- News sources other than the Guardian, and news sections other than world, business and environment.
- Matching events from before an alert was created.
- Digests, quiet hours and per-alert cooldowns.
- In-app, push, SMS or any third channel.
- A public API.
- Billing and paid plans.
- Languages other than English.
- Polling real sources outside production.

## Further Notes

- **Keys only the user can create, needed before the increment that uses them ships:**
  - a Resend account and a verified sending domain, with its DNS records;
  - a Guardian developer key;
  - a CoinGecko Demo key;
  - one Slack incoming webhook for checking production.

  They go into the hosting environment, never into the repository or the conversation.
- **Rates.** Guardian polling every 3 minutes uses 480 of the key's 500 calls a day. CoinGecko every 5 minutes uses about 8,900 of 10,000 a month. Both must stay production-only.
- **Use of the Guardian's non-commercial developer key** for this project is the user's judgment of its terms, not a verified fact.
- **Unverified points from the research** are listed in `docs/process/research-01-slack-oauth-vercel-cron.md` and `docs/process/research-02-event-feeds.md`. Implementation must not rely on them without checking.
- **The scheduler path is checked only locally.** The same `pg_cron` job against the hosted Supabase project and the deployed route has to be checked at the first ship.
- **Increments** cut this spec in order of value. The first should deliver the most valuable flow end to end: create an alert and receive an email when a matching event arrives.

