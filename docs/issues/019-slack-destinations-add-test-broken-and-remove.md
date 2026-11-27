# #19: Slack destinations: add, test, broken and remove

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/19

## Body

## Parent

#4

## What to build

A user connects Slack channels on `/destinations`: adds one by name and webhook URL on its own page, sees it by name and hint only, sends a test, sees it marked broken when Slack says it is gone, and removes it unless it is some alert's only destination. Stories 9–16. Design: `docs/design/screens/destinations.md`, `add-slack-destination.md`.

Screens: `docs/design/` (README, "Increment 2"); the design decisions recorded on #4 hold. Every screen works at 360px and desktop width, by keyboard and screen reader with no axe violations, and handles loading, empty, error and success (stories 68, 69).

## Acceptance criteria

- [ ] `/destinations/slack/new` adds a destination with every error in the design, the 10-destination limit included; success returns to `/destinations` with its notice
- [ ] Rows show the name, "Slack" and the hint; the URL never reaches the browser
- [ ] Send test works for Slack: delivered, transient failure, the 5-per-day limit, and a permanent answer that marks the destination broken with its reason; a successful test returns a broken destination to active
- [ ] A broken destination shows "Broken" with its reason, by text and icon
- [ ] Remove opens the confirmation; a refusal shows inside the dialog as designed; focus behaves as designed
- [ ] Playwright specs on both projects against the Slack stub, broken state included



## Contracts already in place

- **Add:** the route `/destinations/slack/new` exists as a placeholder. The form schema is `addSlackDestinationSchema({ allowLocalStub })` in `src/features/destinations/schema.ts`; pass `allowsLocalSlackStub()` from `src/lib/env.server.ts`. Write with `rpc("add_slack_destination", { p_name, p_url })`, which returns the new id. Its errors: `23505` → name error "You already have a destination called <name>."; `P0001` with message `slack_destination_limit` → form error "You have 10 Slack destinations, the most an account can have. Remove one before adding another."; `22023` → the URL error; anything else → "Couldn't add the destination. Try again in a minute." Success: `redirect(withNotice("/destinations", "slack-destination-added"))`.
- **List:** read `id, name, channel_type, hint, status, broken_reason, created_at` from `destinations` (never `settings`, which is not readable). Email first, then Slack oldest first.
- **Send test for Slack:** `rpc("claim_test_send", { p_destination_id })` now also returns `slack_test_limit` ("Not sent. You've sent 5 tests to this destination today."). On `ok`, read the URL with `rpc("slack_test_target", { p_test_send_id })` (null means do not send), parse it with the channel's `settingsSchema`, send with `slackChannel.sendTest`, then `rpc("finish_test_send", { p_test_send_id, p_delivered, p_error, p_broken_reason })`, passing the outcome's `destinationReason` as `p_broken_reason` when the outcome is `broken`. That marks the destination broken; a delivered test returns it to active. Show results as `docs/design/screens/destinations.md` says.
- **Remove:** `removeDestinationSchema`; `rpc("remove_destination", { p_destination_id })` returns `{ outcome: "ok" | "only_destination", alert_count }`. On `only_destination` the dialog shows "<name> is the only destination of N alerts. Change them first." ("1 alert"). On `ok`, `withNotice("/destinations", "slack-destination-removed")` or the same notice in place. Use the shadcn `alert-dialog`.
- Shared components: `BrokenMark` (`src/components/broken-mark.tsx`), `NotificationStatus`, `Notice`, `PageContainer`, `PageHeader`. Icons `Hash` and `Unplug` from `lucide-react`.
- **e2e:** the local Slack stub runs with every e2e run. `slackToken()`, `slackStubUrl(token)`, `setSlackAnswer(token, { status, body })` and `slackMessages(token)` are in `e2e/support/slack.ts`. Use a new token per test.

## Owned paths

- `src/features/destinations/**`, except `schema.ts` and `schema.test.ts`
- `src/app/(app)/destinations/**`
- `e2e/destinations.spec.ts`, `e2e/slack-destinations.spec.ts` (new)

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. Pending buttons keep focus (`aria-disabled`, not `disabled`; increment 1 UX review, item 5). End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, delete it with `deleteUser()`, and never write through the demo accounts. The local database is shared: assert only on your own rows. Remove your page's "Not built yet." placeholder. Do not add migrations, dependencies, shadcn components, or edit `src/components/ui/` or `globals.css`: report a missing contract instead.

**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in.

