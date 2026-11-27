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

_Written in this increment's Refine phase, before Design. Implementers read them here._

