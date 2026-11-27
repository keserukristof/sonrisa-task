# Slack message

- **Sent by:** the Slack channel, to a destination's incoming webhook, as a Block Kit message.
- **Purpose:** the same content as the alert email, formatted for a Slack channel.
- **Artboard:** [html/SlackMessage.dc.html](../html/SlackMessage.dc.html), screenshot `2-slack-message.png`. The artboard draws the blocks in a neutral chat frame to show order and copy; Slack renders them in its own style.

## Alert message, blocks in order

1. **header** is not used, because a header block cannot hold a link. Instead a **section** with `mrkdwn`: `*<event URL|event title>*`. Example: _Bitcoin (BTC) up 4.2% in the past hour_, linking to the coin's CoinGecko page. Without a URL, the title is bold without a link.
2. **section** (`mrkdwn`): `*<Severity>* · <summary>`, for example "_Moderate_ · Price $64,210. 24-hour change −1.8%." News has severity Low.
3. **context** (`mrkdwn`): `Alert: <alert name> · <credit>`, for example "Alert: Crypto swings · Powered by CoinGecko". Credits: U.S. Geological Survey, Source: The Guardian, Powered by CoinGecko.

The top-level `text` (used for notifications and screen readers) is "[<Severity>] <title> · <alert name>", like the email subject.

## Simulated event

- The title gets the `[SIMULATED]` prefix: "[SIMULATED] Test quake near Tokyo".
- A banner line comes right after the title, as its own section: "_This is a simulated event created by an admin. Nothing happened._"
- The context line ends "Simulated by an admin" instead of a credit.
- The top-level `text` starts "[SIMULATED] ".

## Test message

Sent by "Send test" on `/destinations`:

1. section: "_This destination works_"
2. section: "You sent this test from your destinations page on 27 Nov 2026 at 18:12 UTC. Notifications from your alerts arrive in this channel."
3. context: "Heads-up · <link to /destinations|Manage your destinations>"

## Rules

- Times in UTC, labelled, as everywhere.
- Escape `&`, `<` and `>` in every text taken from an event, as Slack's `mrkdwn` requires.
- No emoji, no colour attachments: severity is a word.
