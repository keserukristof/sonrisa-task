# Add Slack destination

- **Route:** `/destinations/slack/new`. Its own page, like `/alerts/new` (decision log, 2026-11-27 18:29).
- **Purpose:** connect a Slack channel by pasting an incoming webhook URL and naming it.
- **Primary action:** "Add destination".
- **Data:** none to read. The action counts the account's Slack destinations and checks the name is unique.
- **Artboards:** [html/AddSlack.dc.html](../html/AddSlack.dc.html), [html/AddSlackErrors.dc.html](../html/AddSlackErrors.dc.html). Screenshots `2-add-slack.png`, `2-add-slack-errors.png`.

## Layout, top to bottom

1. **App header**, "Destinations" current.
2. **Main**, at most 560px wide (the form width), centred, 24px padding:
   - "Back to destinations", an underlined link to `/destinations`, 8px above the title (not a ghost button: increment 1 review, m4).
   - The `h1` "Add Slack destination", 8px above the intro.
   - An intro line in `muted-foreground`, 24px above the form.
   - A padded card holding the form, fields 24px apart:
     1. **Name**: a text input, then its hint.
     2. **Webhook URL**: a text input (`type="url"`, `autocomplete="off"`, `spellcheck="false"`), then its hint.
     3. The form-level error Notice, when there is one, directly above the buttons.
     4. "Add destination" (primary) and "Cancel" (outline, a link back to `/destinations`), 8px apart.

## Copy

- **Back link:** Back to destinations
- **Heading:** Add Slack destination
- **Intro:** Alerts can post to a Slack channel through an incoming webhook.
- **Name hint:** Shown on your destinations and alerts. Up to 60 characters.
- **Webhook URL placeholder:** https://hooks.slack.com/services/…
- **Webhook URL hint:** Create an incoming webhook for the channel in Slack, then paste its URL. Heads-up never shows it again: you see only its last 4 characters.
- **Buttons:** Add destination (pending: Adding…), Cancel

## Errors

Validated on submit with the destination's Zod schema. Each field error sits under its hint, linked by `aria-describedby`, and the input gets `aria-invalid="true"`. Focus moves to the first invalid field. What the user typed is kept, the URL included.

| Field | Rule                                                                                                              | Message                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Name  | Empty                                                                                                             | Enter a name.                                                                                   |
| Name  | Over 60 characters                                                                                                | Use at most 60 characters.                                                                      |
| Name  | Same as another of the account's destinations (case-insensitive, trimmed)                                         | You already have a destination called Ops channel.                                              |
| URL   | Not `https://hooks.slack.com/services/…` (outside production, `http://127.0.0.1:<port>/slack/…` is also accepted) | Paste a Slack incoming webhook URL. It starts with https://hooks.slack.com/services/.           |
| Form  | The account already has 10 Slack destinations                                                                     | You have 10 Slack destinations, the most an account can have. Remove one before adding another. |
| Form  | Anything else failed                                                                                              | Couldn't add the destination. Try again in a minute.                                            |

The form-level error is an error Notice (`role="alert"`) above the buttons; focus moves to it.

## After success

Redirect to `/destinations` with the success Notice "Slack destination added. Send a test to check it works." The new row is last in the list. The URL is not echoed anywhere.

## States

No data view: the page renders at once. The submit button shows "Adding…" while pending and keeps focus (`aria-disabled`).

## Responsive

At 360px the page padding is 16px, the card padding 16px, and the two buttons stay on one line.

## Components

Header, Field (input, label, hint, error), Button (primary, outline), Notice.
