# #3: Increment 1: a user gets an email when an earthquake that matters to them happens

- **State:** open
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

_Written in this increment's Refine phase, before Design. Implementers read them here._

