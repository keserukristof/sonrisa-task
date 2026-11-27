# #27: End to end: a simulated event reaches Slack, and a gone channel turns broken

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/27

## Body

## Parent

#4

## What to build

The whole path through Slack, proven in the browser against the local stub: an alert to a Slack destination, a simulated event, the tick, a delivered message; then the stub answers "channel not found" and the destination shows as broken on `/destinations` and `/alerts`. Stories 15, 34, 60.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] A Playwright spec on both projects: create a Slack destination on the stub, an alert using it, simulate a matching event, run the tick, and see the stub receive the Block Kit message and history show Sent
- [ ] With the stub set to a permanent error, the next delivery fails with the Slack reason and the destination shows Broken with its reason on `/destinations` and "(broken)" on `/alerts`
- [ ] The test creates and deletes its own account



## Contracts already in place

- The Slack stub helpers are in `e2e/support/slack.ts`; the stub starts with every e2e run.
- Run the tick as `e2e/end-to-end.spec.ts` does: `POST /api/tick` with `Authorization: Bearer ${process.env.TICK_SECRET}`. The tick processes everyone's rows; assert only on this test's account.
- Simulate as that spec does, through `/admin/simulate` (now under the admin tabs) with an admin created by `createUser({ admin: true })`.
- To see "broken" arrive through delivery, set the stub's answer to `{ status: 404, body: "channel_not_found" }` before the tick.

## Owned paths

- `e2e/slack-end-to-end.spec.ts` (new)

Nothing under `src/`. If the path does not work end to end, report which ticket's behaviour fails instead of fixing it here.

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

