# #18: Slack channel: Block Kit messages and delivery outcomes

- **State:** open
- **Opened:** 2026-11-27 18:14 UTC by keserukristof
- **Labels:** `ready-for-agent`
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/18

## Body

## Parent

#4

## What to build

The Slack channel implements the Channel interface: it posts the alert, simulated and test messages to an incoming webhook as Block Kit, and classifies Slack's answers. Once registered, the tick delivers to Slack destinations with no change to the alerting core. Story 34. Design: `docs/design/screens/slack-message.md`.

## Acceptance criteria

- [ ] Rendering as designed: a linked title section, severity in words and the summary, a context line with the alert name and the source credit; the simulated variant with `[SIMULATED]` and its banner line; the test message
- [ ] Text from events is escaped for Slack's `mrkdwn`
- [ ] Outcome classification on literal responses: sent; retry for transient failures, honouring `Retry-After` on 429; broken for `no_service`, `channel_not_found`, `channel_is_archived`, `action_prohibited`, `invalid_token`, `team_disabled`, `no_active_hooks`, 404 and 410, with the reason in our words
- [ ] Failure sentences start "The Slack …" and end with a full stop
- [ ] The channel is registered with the tick; unit tests cover rendering and classification, and no test calls Slack

