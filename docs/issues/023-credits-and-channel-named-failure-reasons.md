# #23: Credits and channel-named failure reasons

- **State:** closed, closed 2026-11-27 19:46 UTC
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/ai-task/issues/23

## Body

## Parent

#4

## What to build

Every place that shows an event credits its source, and failure reasons name their channel. Story 47 (credits in history and email). Design: `docs/design/screens/notifications.md`, `emails.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] Notification history rows carry the source's credit under the event time; the single USGS line under the list is gone
- [ ] The email footer starts with the source's credit; simulated events have none
- [ ] Stored failure sentences start "The email …" or "The Slack …" and end with a full stop; history shows those and nothing else
- [ ] History shows Slack destinations as "Slack · <name>"
- [ ] Unit tests for the credit in email rendering and history rows



## Contracts already in place

- `sourceCredit(source)` in `src/lib/alerting/sources/catalog.ts` gives the credit line, or null for simulated events.
- Notification history: the event's `source` is readable from `events`. The destination's name and type are readable from `destinations`; the notification keeps `channel_type` after a destination is removed (then `destination_id` is null).
- `notification-row.ts` accepts only failure sentences matching `/^The email [^.]{1,120}\.$/`. Widen it to "The email …" or "The Slack …", ending with a full stop, as #4 says; anything else keeps the fallback.
- Slack failure sentences are the `failure` strings in `src/lib/alerting/channels/slack/reasons.ts`, plus "The Slack destination was removed." and the Slack channel's transient give-up sentence (#18). Do not import the Slack channel; match the pattern.
- Email: the footer starts with the credit, then a full stop (`docs/design/screens/emails.md`). Check every email failure sentence in `channels/email/outcome.ts` starts with "The email ".

## Owned paths

- `src/features/notifications/**`
- `src/app/(app)/notifications/**`
- `src/lib/alerting/channels/email/**`
- `e2e/notifications.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

## Comments

### keserukristof, 2026-11-27 19:46 UTC

Merged into increment-2; report checked against its diff (owned paths only).

