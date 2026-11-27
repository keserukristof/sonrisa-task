# #3: Increment 1: a user gets an email when an earthquake that matters to them happens

- **State:** closed, closed 2026-11-27 18:05 UTC
- **Opened:** 2026-11-27 11:21 UTC by keserukristof
- **Labels:** none
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/3

## Body

Part of #2.

## What ships

The whole alerting engine with its first source and first channel: the scheduler, the tick, the outbox, the USGS source, the email channel, sign-up with confirmation, alerts, notification history, and a thin admin slice (the admin role, the admin guard and the simulate page) so a reviewer can make an alert fire on demand.

## Spec user stories delivered

1. As a visitor, I want to sign up with my email address and a password, so that I can set up my own alerts.
2. As a visitor, I want to confirm my email address through a link sent to it, so that nobody can create an account that makes the system email me without my consent.
3. As a visitor whose confirmation email has not arrived, I want to see that my account is waiting for confirmation, so that I know why I cannot sign in yet.
4. As a user, I want to sign in with my email address and password, so that I can manage my alerts.
5. As a user, I want to see a clear error when my email or password is wrong, so that I can correct it.
6. As a user, I want to sign out, so that nobody else on this device can use my account.
7. As a signed-out visitor, I want any page that needs an account to send me to sign in, so that I never see a broken page.
8. As a user, I want my account email address to be available as a destination without any setup, so that I can create an email alert straight away.
13. As a user, I want to send a test notification to any destination, so that I can check it works before relying on it.
14. As a user, I want to see the result of the test (delivered, or the reason it failed), so that I can fix a broken destination.
18. As a user, I want to create an alert by choosing a category (news, markets or natural disasters), so that I hear only about the kind of thing I care about.
19. As a user, I want to set a minimum severity for markets and natural disasters alerts, so that only events important enough to me notify me.
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
32. As a user, I want one notification per matching event per destination, so that I am told once, not repeatedly.
33. As a user, I want an email notification to say what happened, its category and severity, when, which alert matched, and a link to the source, so that I can act on it.
35. As a user, I want notifications to arrive within a few minutes of the source reporting the event, so that they are still useful.
36. As a user, I want a failed send to be retried a few times before it is given up, so that a brief outage does not lose my notification.
37. As a user, I want to see my notification history with the event, the alert, the destination, the status (pending, sent, failed, skipped) and the reason for any failure or skip, so that I can trust or debug my alerts.
38. As a user, I want at most 10 alert emails an hour, with the rest recorded as skipped, so that a broad alert cannot bury my inbox.
39. As a user, I want a notification skipped because a system limit was reached to say so in my history, so that I am not left wondering.
40. As a user with no notifications yet, I want an empty state that says notifications will appear here once an alert matches, so that an empty list does not look broken.
44. As a user, I want earthquakes of magnitude 4.5 and above to be available as events, so that I can be told about significant ones.
45. As a user, I want each event's severity to be shown on one common four-level scale, so that I can compare events across categories.
46. As a user, I want the same event reported twice by a source to produce one event, so that I am not notified twice.
58. As an admin, I want to create a simulated event by choosing its category, severity, title and optional details, so that I can prove the whole path works in seconds.
59. As an admin, I want a simulated event to be marked as simulated everywhere it appears, including in the notification, so that nobody mistakes it for a real event.
60. As an admin, I want a simulated event to go through exactly the same matching, limits and delivery as a real one, so that a successful simulation proves the real path.
61. As the operator, I want sources and delivery to run every minute without anyone visiting the site, so that alerts work around the clock.
62. As the operator, I want alert emails to stop at 80 a day across the system, keeping 20 of the provider's 100 for sign-up confirmations, so that new users can always confirm their address.
63. As the operator, I want only the production deployment to poll real sources, so that local development and tests cannot use up the production keys' quotas.
64. As the operator, I want the scheduled call to be authenticated with a secret that can do nothing except start a tick, so that a leaked secret cannot open the database.
65. As a developer, I want local development to work with recorded source responses and simulated events, so that I need no keys to run the app.
66. As a developer, I want emails sent locally to land in the local mail catcher, so that I can see them without a provider.
68. As any visitor, I want every page to work on a mobile width and to be usable with a keyboard and a screen reader, so that nobody is shut out.
69. As any visitor, I want every data view to show a loading state, an empty state and an error state, so that I always know what is happening.

## Notes

- Stories 13 and 14 (send test) cover the email destination only; Slack comes in increment 2.
- Story 20 (news severity disabled) comes with the Guardian source in increment 2.
- The rest of the admin view comes in increment 3.

## Acceptance criteria

_Written in the Refine phase on 2026-11-27, from three grill rounds recorded in `docs/process/decision-log.md`. The product is called **Heads-up**. Every time shown anywhere is in UTC and labelled "UTC"._

### Account (stories 1–7)

- **Sign-up (1).** `/sign-up` takes an email and a password of at least 8 characters. Field errors show under their field. On success it redirects to `/sign-up/confirm`.
- **Confirmation (2).** Confirmation is on in every environment, including local (`supabase/config.jsonc` today has `enable_confirmations: false`; Contracts turns it on). The link confirms the address, signs the visitor in, and opens `/alerts` with the notice "Email confirmed". An expired or already used link shows "This link has expired or was already used" with a link to sign in.
- **Waiting (3).** `/sign-up/confirm` names the address and says to open the link, and to look in spam. There is no resend button. Signing up with an address that already has an account shows the same page, so the response never reveals whether an account exists.
- **Sign-in (4, 5).** `/sign-in` with a correct email and password lands on the `next` path, or on `/alerts`. Wrong credentials show "Email or password is incorrect." without saying which. An unconfirmed account shows "Your email address isn't confirmed yet" with a link to `/sign-up/confirm`.
- **Sign-out (6).** "Sign out" in the header ends the session and lands on `/`. Using the browser's back button afterwards does not show account data.
- **Guards (7).** Every page under `/alerts`, `/notifications` and `/destinations` sends a signed-out visitor to `/sign-in?next=<path>`. `next` is accepted only as a path on this site starting with a single `/`; anything else falls back to `/alerts`. A signed-in user who opens `/`, `/sign-in` or `/sign-up` goes to `/alerts`.
- **Landing.** A signed-out visitor on `/` sees a short page saying what Heads-up does, with "Sign up" and "Sign in".
- **Header.** Signed in, the header links Alerts, Notifications, Destinations, Admin (admins only) and Sign out.

### Destinations (stories 8, 13, 14)

- **Email destination (8).** Every new account has exactly one email destination, created with the account. It shows on `/destinations` as "Account email" with the account's address and "can't be removed". There is no remove control, and no Slack placeholder in this increment.
- **Send test (13, 14).** "Send test" sends at once, without waiting for a tick, and shows the result inline: "Delivered at HH:MM UTC", or the reason it failed. A test counts toward the 10-an-hour and 80-a-day email limits through its own log, which notification history does not show. Over either limit it is refused, and the reason names the limit. An account gets 3 test sends per UTC day, and all test sends together use at most 20 of the system's 80 a day (added after the security audit). The test email's subject begins "Test from Heads-up".

### Alerts (stories 18, 19, 20 brought forward, 21–31)

- **Form fields (18, 19, 24).**
  - Name: required, 1 to 80 characters, need not be unique.
  - Category: news, markets or natural disasters, with no default.
  - Minimum severity: low, moderate, high or critical, defaulting to moderate.
  - Destinations: one checkbox per destination, with the email destination preselected.
  - New alerts start active.
- **News (20, brought forward).** With news chosen, the severity field is disabled and explains "News has no severity levels; every article matches". The alert is saved with no minimum severity.
- **Keywords (21).** One optional comma-separated field. Keywords are trimmed, lowercased and de-duplicated, and empty entries are dropped. At most 10, each up to 40 characters; going over is a field error. They are shown back as chips, and kept when the category changes.
- **Destinations required (22, 23).** Saving with no destination checked is refused with a field error on the destinations group. A destination of another user is refused by the database, not only by the form.
- **Errors (31).** Every validation error shows next to its field, from the same Zod schema the Server Action uses. A server error shows inline under the form, and the values entered are kept.
- **List (25).** `/alerts` shows one row per alert: name, category, "≥ severity" (none for news), keyword chips, destination names, an Active switch, Edit and Delete. On a mobile width each row stacks as a card.
- **Empty state (26).** With no alerts, `/alerts` shows "Create your first alert". It explains that an alert tells you when an event in a category you choose reaches a severity you choose, says the account email is ready as a destination, and has a "Create alert" button.
- **Edit (27).** `/alerts/<id>/edit` opens the form filled in. Saving keeps the alert's creation time. Opening another user's alert gives the 404 page.
- **Pause (28).** The Active switch pauses and resumes in one click and shows Active or Paused. Events that arrive while an alert is paused are never matched to it, even after it resumes.
- **Delete (29).** Delete opens a dialog: "Delete "<name>"? It stops matching events. Past notifications stay in your history." After confirming, the alert is gone from the list. Its notifications stay in history as "Deleted alert" and keep counting toward the limits.
- **Limits in the database.** The keyword rules are enforced by the database as well as by the form, and an account can have 50 alerts at most (added after the security audit).
- **Only new events (30).** An alert matches only events ingested after it was created.
- **Matching rules.** An event matches an active alert when:
  - the category is equal;
  - the severity is at or above the minimum (any severity for news);
  - every keyword appears in the title or summary as a whole word, case-insensitive (`art` does not match "Martinique").

### Notifications (stories 32, 33, 35–40)

- **One per destination (32).** One notification per event and destination, even when several alerts of the same user match.
- **Email content (33).**
  - Subject: `[<Severity>] <event title> · <alert name>`.
  - Body, in plain HTML with a text fallback:
    - the title;
    - category, severity, time (UTC) and the alert name;
    - a "View at source" link;
    - "Data: U.S. Geological Survey" for USGS events.
  - The recipient is the account's address, read when sending.
- **Timing (35).** A matching earthquake is emailed within 3 minutes of the next USGS poll that returns it.
- **Retries (36).** A transient failure is retried at 1, 5 and 15 minutes, then marked failed with the last error.
  - A notification already created is delivered even if its alert is later paused or deleted.
- **History (37).** `/notifications` lists the user's notifications, newest first, 25 a page, with Previous and Next links on `?page=`.
  - Each row has the event with its time, the alert (or "Deleted alert"), the destination and the status.
  - A pending row shows its next attempt. A failed or skipped row shows its reason.
  - A user sees only their own notifications.
- **Limits (38, 39).**
  - The 11th alert email for a user within any 60 minutes is recorded as skipped, "Hourly limit (10) reached".
  - The 81st alert email system-wide in a UTC day is skipped, "Daily system limit (80) reached".
- **Empty state (40).** With no notifications, `/notifications` says they will appear here once an alert matches an event, and links to `/alerts`.

### Events and the USGS source (stories 44–46)

- **USGS (44).**
  - The source polls the USGS past-day GeoJSON feed of magnitude 4.5 and above, once a minute, in production only.
  - The external id is the USGS event id.
  - The summary includes the place, the magnitude and the depth.
- **Severity (45).** Magnitude 4.5–5.4 is low, 5.5–6.4 moderate, 6.5–7.4 high, and 7.5 and above critical. A PAGER alert of orange or red raises it to at least high. Severity shows with the same four labels everywhere.
- **No duplicates (46).** The same USGS id stored twice produces one event. A later revision of an event (a new magnitude) is ignored; the first version stays. This is an accepted limitation.
- **Malformed input.** A malformed feed item is skipped, the rest of the poll is kept, and the poll records its outcome.

### Admin slice (stories 58–60)

- **Access.** `/admin` redirects to `/admin/simulate`, the only admin page in this increment. A signed-in non-admin or a signed-out visitor gets the 404 page.
- **Simulate form (58).**
  - Fields: category (all three), severity (forced to low and disabled for news), title (required, up to 200 characters), and optional summary and link (a valid http or https URL).
  - On success the page says "Event created. The next tick, within a minute, matches and delivers it." and links to `/notifications`.
- **Simulated marking (59).**
  - The event is stored with the reserved `simulated` source and flagged simulated.
  - Its email subject starts `[SIMULATED]`, and the body opens with "This is a simulated event created by an admin. Nothing happened."
  - History marks it "Simulated".
- **Same path (60).** A simulated event is matched, limited and delivered by the scheduled tick exactly like a real one. Nothing in the simulate action sends anything or runs a tick.

### Operations (stories 61–66)

- **Scheduler (61).** `pg_cron` calls the tick route every minute through `pg_net`. Alerts fire with nobody visiting the site. This is checked in production at ship, with a screenshot of a simulated event's email arriving.
- **Email budget (62).** As in Limits above. The daily count resets at 00:00 UTC.
- **Real polling (63).** Real polling runs only when the production flag is set. Locally and in tests, no request reaches USGS.
- **Tick secret (64).** The tick route accepts only its own tick secret, compared in constant time. Anything else gets 401 and no tick. The tick secret is not the Supabase secret key.
  - The `net` schema cannot be restricted from a migration (ADR-0003 addendum). The API does not expose it, and an end-to-end test proves that on every run.
  - The scheduler reads the tick URL and the tick secret from Supabase Vault and does nothing until both are set.
- **Local development (65).** Local development runs with no keys, using recorded USGS responses committed to the repository, and simulated events.
- **Local email (66).** Locally, alert, test and confirmation emails land in the local mail catcher (web UI on port 54324).

### Every page (stories 68, 69)

- **Accessibility (68).**
  - Every page works at 375 px wide.
  - Every control can be reached and used with the keyboard, with a visible focus.
  - Form errors are tied to their fields for screen readers.
  - The Playwright axe scan has no violations.
- **States (69).** Every data view shows a skeleton in its shape while loading, its empty state, and on failure a card ("Couldn't load your …") with "Try again", which re-renders that section.

### Tests this increment adds (from the spec's testing decisions)

- **`runTick` integration**, over the local database with fake sources, fake channels and a fake clock. It covers:
  - matching on category, severity and whole-word keywords;
  - events ingested before an alert was created not matching it;
  - paused alerts not matching;
  - one notification per event and destination;
  - the two email limits;
  - the retry schedule and final failure;
  - a source failure not stopping other sources;
  - back-to-back and concurrent ticks sending once;
  - simulated events taking the same path;
  - polling only when the interval has passed and the flag is on.
- **USGS mapper unit tests** on recorded responses: the severity boundaries, the PAGER raise, external ids, and malformed items being skipped.
- **Email channel unit tests:** rendering, including the simulated marking, and outcome classification.
- **Zod schema tests:** a destination is required; news has no severity; the keyword limits.
- **pgTAP**, covering:
  - a user cannot read or change another user's alerts, destinations or notifications;
  - nobody signed in reads destination settings;
  - an alert cannot link another user's destination;
  - only admins simulate;
  - keyword limits, the test-send limits and the alert limit hold in the database;
  - the tick's matching and claiming functions, which only the tick may call.
- **Playwright with axe:**
  - sign up, confirm through the mail catcher, and sign in;
  - create, edit, pause and delete an alert;
  - an admin simulating an event and seeing the notification as sent.

