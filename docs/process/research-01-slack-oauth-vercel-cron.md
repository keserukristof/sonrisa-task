# Research 01: Slack OAuth install and Vercel cron limits

Requested 2026-11-27 10:41 during the phase 1 grill, after Slack delivery was chosen to go through a Slack app with OAuth. A research sub-agent (general-purpose, read-only) was given the main session's beliefs as unverified claims and told to confirm or correct each from the vendor's own documentation, and to say "unverified" where it could not. Its report is below, unchanged. The brief it was given is in the [prompt history](../prompts/README.md).

## What changed because of it

- The handover's claim about Vercel Hobby scheduling (daily for legacy Cron Jobs, 15 minutes at best for Schedules) holds, and now has a source.
- A Slack redirect URL must use HTTPS, so the install flow cannot be tested against plain `http://localhost`.
- A Slack app installs only into the workspace that created it until distribution is activated. A reviewer's own workspace needs that.
- With the `incoming-webhook` scope the user picks the channel on Slack's own screen and the app receives a webhook URL, so "Add to Slack" does not require a bot token or a channel picker of our own.

## The report, verbatim

All points read from vendor docs on 2026-11-27. No local files touched; no project data sent.

**Part 1: Slack**

1. Yes: with `incoming-webhook`, the Authorize screen lets the user "pick the channel". The response has `incoming_webhook` with `channel`, `channel_id`, `configuration_url`, `url` (belief confirmed). The documented POST carries no token or Authorization header (the URL "contains a secret"), so no bot token is needed to post; this is shown by example, not stated. The response still includes an `xoxb` token. Channel, username and icon cannot be overridden. The `oauth.v2.access` reference page itself does not show the object.
   https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks

2. Post: `chat:write`. `chat:write.public` = "Send messages to channels your Slack app isn't a member of" (requires `chat:write`); without it the app must be a member. List public channels: `conversations.list` with `channels:read` (Tier 2, cursor-paginated, default type `public_channel`). Private channels: explicit bot-invite rule not stated; nearest is `no_permission`: "Make sure your app is a member of the conversation".
   https://docs.slack.dev/reference/methods/chat.postMessage , https://docs.slack.dev/reference/scopes/chat.write.public , https://docs.slack.dev/reference/methods/conversations.list

3. "The `redirect_uri` must use HTTPS." `http://localhost` for a server-side flow: unverified. The only localhost mention is for PKCE (opt-in, irreversible, for desktop/mobile clients). Plan on an HTTPS tunnel.
   https://docs.slack.dev/authentication/installing-with-oauth , https://docs.slack.dev/authentication/using-pkce/

4. Yes: an undistributed app installs only on its own workspace (error `invalid_team_for_non_distributed_app`). Activate under Manage Distribution after completing a checklist; needs an OAuth flow and SSL on redirect URLs. Docs say Marketplace-listed apps are reviewed; no review for unlisted distribution is implied, not stated. Caveat: some workspaces allow only Marketplace-listed apps or require admin approval.
   https://docs.slack.dev/app-management/distribution/

5. Opt-in, and "may not be turned off once it's turned on"; tokens then expire every 12 hours.
   https://docs.slack.dev/authentication/using-token-rotation

6. Webhook, verified mappings (2016 changelog): `channel_not_found` 404, `channel_is_archived` 410, `action_prohibited` 403, `invalid_payload` 400. On revocation, webhooks tied to the bot token "will be removed"; `no_service` = webhook "disabled, removed, or invalid" (that uninstall yields `no_service` is my inference). Also listed: `no_active_hooks`, `team_disabled`, `invalid_token`. Bot token: check `ok:false` + `error`; permanent ones are `account_inactive` (bot token for deleted user/workspace), `token_revoked`, `invalid_auth`, `channel_not_found`, `is_archived`.
   https://docs.slack.dev/changelog/2016-05-17-changes-to-errors-for-incoming-webhooks , https://docs.slack.dev/reference/methods/chat.postMessage

7. Webhooks: 1 per second, short bursts allowed. `chat.postMessage`: about 1 message per second per channel, plus a workspace-wide limit of "several hundred messages per minute". Rate-limited: HTTP 429 with `Retry-After` in seconds.
   https://docs.slack.dev/apis/web-api/rate-limits

**Part 2: Vercel**

8. Legacy Cron Jobs on Hobby: 100 per project, once per day, precision per-hour (±59 min); more frequent expressions fail deployment. Belief confirmed for Cron Jobs, but outdated overall: Cron Jobs are now "legacy". Schedules (Beta, all plans, limits may change) allow Hobby every 15 minutes, with a fixed 15-minute jitter window. Hobby caps: 1,000 schedules per team, 100 static per deployment, 500 dynamic creations and 5,000 runs per billing period; over the cap, runs are skipped. My arithmetic: one 15-minute schedule is about 2,900 runs a month, so two exceed the cap.
   https://vercel.com/docs/cron-jobs/usage-and-pricing , https://vercel.com/docs/schedules , https://vercel.com/docs/schedules/limits

**Unverified**

- Whether `http://localhost` redirect URLs are accepted for a standard flow.
- Distribution checklist items; an explicit "no review" statement.
- HTTP status for `no_service`, `invalid_token`, `team_disabled`, `no_active_hooks`; what a deleted (not archived) channel returns; webhook error body format.
- HTTP status of Web API error responses (only `ok:false` documented on pages read).
- Whether a bot must be invited to private channels, and whether `conversations.list` returns private channels it is not in; `groups:read` mapping.
- Webhook-specific 429 body.
- Whether token rotation affects webhook URLs.
