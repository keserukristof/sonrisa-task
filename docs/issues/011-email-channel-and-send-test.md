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

