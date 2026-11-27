# #5: Increment 3: an admin sees and runs the whole system

- **State:** closed, closed 2026-11-27 17:10 UTC
- **Opened:** 2026-11-27 11:21 UTC by keserukristof
- **Labels:** none
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/5

## Body

Part of #2.

## What ships

The read-only admin lists of users, alerts, events and notifications, source health, today's email budget, promotion and demotion, and the reviewer admin login.

## Spec user stories delivered

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
67. As a reviewer, I want an admin login handed over privately, so that I can see the admin area on the live site.
68. As any visitor, I want every page to work on a mobile width and to be usable with a keyboard and a screen reader, so that nobody is shut out.
69. As any visitor, I want every data view to show a loading state, an empty state and an error state, so that I always know what is happening.

## Acceptance criteria

_Written in this increment's Refine phase, before Design. Implementers read them here._

## Comments

### keserukristof, 2026-11-27 17:10 UTC

Merged into #4 on 2026-11-27: increment 1 ran past the 17:30 checkpoint, so increments 2 and 3 became one smaller increment (plan of attack). Stories 48, 49, 51–54, 67, 68 and 69 moved to #4. Stories 50 and 55–57 were dropped and are recorded in #2's Out of Scope.

