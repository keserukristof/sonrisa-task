# #11: Email channel and send test

- **State:** open
- **Opened:** 2026-11-27 14:20 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/11

## Body

## Parent

#3

## What to build

The email channel: it renders the alert, simulated and test emails, sends them through Resend in production and to the local mail catcher over SMTP otherwise, and classifies each outcome as sent, retry or broken. The destinations page shows the account email and sends a test at once, showing the result inline.

Stories 8, 13, 14, 33 and 66 of #3. Screens: `docs/design/screens/destinations.md`, `emails.md`.

## Acceptance criteria

- [ ] The channel implements the Channel interface; the recipient is the account's address, read when sending
- [ ] Unit tests of rendering (subjects, the simulated banner and prefix, the USGS credit, the plain-text alternative) and of outcome classification on literal responses
- [ ] "Send test" sends at once, shows "Delivered at HH:MM UTC" or the reason, and is refused over either email limit with that reason
- [ ] Test sends are recorded in the test-send log, not in notification history
- [ ] Locally, emails land in the mail catcher
- [ ] Loading and error states of the destinations page as designed


## Contracts already in place

- Implement the `Channel` interface from `src/lib/alerting/types.ts` with type `email`: `send`, `sendTest`, and a settings schema that accepts an empty object (the recipient is `target.accountEmail`, never stored). Export the rendering and the outcome classification as pure functions for the unit tests.
- Transport: when `serverEnv().RESEND_API_KEY` is set, call Resend's HTTP API with `fetch`; otherwise send over SMTP with `nodemailer` (already installed) to `SMTP_HOST`:`SMTP_PORT`, the local mail catcher. `EMAIL_FROM` and `APP_URL` come from `serverEnv()`.
- "Send test" is a Server Action: `rpc("claim_test_send", { p_destination_id })` returns `ok` with an id, `hourly_limit` or `daily_limit`. On `ok`, send with the channel's `sendTest`, then `rpc("finish_test_send", { p_test_send_id, p_delivered, p_error })`. The claim counts against both email limits whatever the outcome.
- The page reads `id, name, channel_type, status` from `destinations`; `settings` is not readable. The address shown is the signed-in user's email.
- Shared components: `NotificationStatus` (with its `label` prop for "Delivered at …"), `Notice`, `PageContainer`, `PageHeader`.
- An end-to-end test of "Send test" must use its own account: the demo user's hourly limit is shared by every run.

## Owned paths

- `src/lib/alerting/channels/email/**`
- `src/features/destinations/**`
- `src/app/(app)/destinations/**`
- `e2e/destinations.spec.ts`

**For every ticket:** forms use `Field`, `FieldGroup`, `describedBy` and `SubmitButton` from `src/components/`, and return `ActionResult` (`src/lib/action-result.ts`). Feedback is a `Notice`; a notice after a redirect uses `withNotice()` and `<FlashNotice>` (`src/lib/notices.ts`). Times go through `src/lib/format.ts`. Links that look like buttons use `buttonVariants()` on a `Link`; page buttons are `size="lg"` (36px), row buttons the default size. End-to-end tests create their own account with `createUser()` from `e2e/support/users.ts`, never write through the demo accounts, and read mail with `waitForEmail()` from `e2e/support/mailbox.ts`. Remove your page's `<Placeholder>`.


**Delete the account in the test's teardown** with `deleteUser()`: every test send counts toward the system's 80 emails a day, which all runs share until the account is gone.


**Accessibility scans:** wait for the page title (`await expect(page).toHaveTitle(…)`) before running axe after a navigation; the title streams in. The suite runs with reduced motion, so panels and dialogs are scanned fully open.


**After the security audit:** `claim_test_send` has a fourth outcome, `test_limit`: an account gets 3 test sends per UTC day. Show "Not sent. You've sent 3 tests today." in the skipped style. `daily_limit` now also covers the system's share for tests (20 of the 80 a day); its copy is unchanged.

