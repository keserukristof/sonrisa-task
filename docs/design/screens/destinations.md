# Destinations

- **Route:** `/destinations`.
- **Purpose:** show where notifications can be sent, let the user add and remove Slack destinations, and check that each destination works.
- **Primary action:** "Add Slack destination" (primary, in the page head). Increment 2 adds it; in increment 1 the page had no primary button.
- **Data:** the user's destinations: the account email, always first, then Slack destinations, oldest first. At most 10 Slack destinations.
- **Artboards:**
  - Increment 2: [html/Destinations2.dc.html](../html/Destinations2.dc.html) (after adding a destination: a delivered test, a broken destination, a refused test), [html/RemoveSlack.dc.html](../html/RemoveSlack.dc.html), [html/RemoveSlackRefused.dc.html](../html/RemoveSlackRefused.dc.html), [html/MobileDestinations2.dc.html](../html/MobileDestinations2.dc.html). Screenshots `2-destinations2.png`, `2-remove-slack.png`, `2-remove-slack-refused.png`, `2-mobile-destinations2.png`.
  - Increment 1: [html/Destinations.dc.html](../html/Destinations.dc.html), the email row alone. Superseded by increment 2 where they differ.
- **The form** that adds a Slack destination is its own page: [add-slack-destination.md](add-slack-destination.md).

## Layout, top to bottom

1. **App header**, "Destinations" current.
2. **Main**, at most 880px wide, centred, 24px padding:
   - Page head: the `h1` "Destinations" on the left, "Add Slack destination" (primary, a link to `/destinations/slack/new`) on the right; 8px above the intro.
   - An intro line in `muted-foreground`, 24px above what follows.
   - A page-level Notice, when one crossed a redirect (see Copy), 24px above the card.
   - One card holding a `<ul>` with one row per destination.

## The email destination row

Unchanged from increment 1. Top-aligned, 16px apart, padded 12px by 16px:

1. A mail icon (lucide `mail`), 20px, in `muted-foreground`.
2. A text block taking the free width: "Account email" at weight 600; the account's address; "Created with your account. It can't be removed." in `muted-foreground`; the test result, 10px below, only after a test.
3. "Send test" (outline, small). No Remove.

## The Slack destination row

Same structure as the email row:

1. A hash icon (lucide `hash`), 20px, in `muted-foreground`. Not Slack's logo: the chrome stays colourless.
2. The text block:
   - The destination's name at weight 600.
   - "Slack · hooks.slack.com/…/" followed by the last 4 characters of the URL, in `muted-foreground`. This hint is all the browser ever receives of the URL: the full URL is never sent to the client after saving.
   - **When broken**, 6px below: the unplug icon (lucide `unplug`) and "Broken." at weight 600, then the reason at weight 400, all in `destructive`. Always shown while the destination is broken, whether or not a test was just sent.
   - The test result, 10px below, only after a test.
3. Actions, 8px apart: "Send test" (outline, small), then "Remove" (danger: outline with `destructive` text, small), which opens the confirmation.

Accessible names carry the destination: "Send test to Ops channel", "Remove Ops channel" (visually hidden suffix). The email row's button is "Send test to Account email".

## Test result

Shown inline in the row with `role="status"`, replacing any earlier result. The region is cleared while pending so that the same text is announced again (increment 1 review, m11). While sending, the button reads "Sending…" and keeps focus (`aria-disabled`, not `disabled`; increment 1 review, item 5).

| Destination | Outcome                      | Display                                                                                                                                                                                |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Either      | Delivered                    | Sent status style (check, `success`): Delivered at 18:12 UTC                                                                                                                           |
| Either      | Transient failure            | Failed status style (cross, `destructive`): Couldn't send the test. Try again in a minute.                                                                                             |
| Slack       | Over 5 tests today           | Skipped status style (barred circle, `warning`): Not sent. You've sent 5 tests to this destination today.                                                                              |
| Slack       | Permanent answer from Slack  | Failed status style, with the reason in our words (see Broken reasons): "Not delivered. Slack says this channel no longer exists." The row's Broken line appears with the same reason. |
| Email       | Hourly, daily or test limits | As in increment 1: Not sent. You've reached 10 emails this hour. / Not sent. Heads-up has reached its 80 emails for today. / Not sent. You've sent 3 tests today.                      |

A successful test of a broken destination returns it to active: the Broken line disappears and the Delivered result shows. Slack tests use no email budget.

## Broken reasons

Slack's permanent answers, in our words. Every reason ends with a full stop.

| Slack's answer                                        | Reason shown                                    |
| ----------------------------------------------------- | ----------------------------------------------- |
| `channel_not_found`, HTTP 404                         | Slack says this channel no longer exists.       |
| `channel_is_archived`                                 | Slack says this channel is archived.            |
| `no_service`, `no_active_hooks`, `invalid_token`, 410 | Slack says this webhook was removed or revoked. |
| `action_prohibited`                                   | Slack's workspace settings block this webhook.  |
| `team_disabled`                                       | Slack says this workspace is no longer active.  |

## Remove confirmation

An `alert-dialog` over the page, as for deleting an alert (components.md, Dialog):

- **Title:** Remove "Ops channel"?
- **Body:** Alerts stop sending to this channel. Past notifications stay in your history.
- **Buttons:** "Cancel" (outline, focused on open), then "Remove destination" (destructive, solid). Pending: "Removing…".
- **On success:** the dialog closes, the row is gone, and the page shows the success Notice "Slack destination removed." Focus moves to the Notice.
- **Refused** (the destination is the only destination of some alerts): the dialog stays open. An error Notice (`role="alert"`) appears under the body: "Ops channel is the only destination of 2 alerts. Change them first." ("1 alert" when N is 1.) "Remove destination" and "Cancel" are replaced by "Go to alerts" (outline, a link to `/alerts`) and "Close" (outline), and focus moves to "Close". The server's check is the only check; the page does not count alerts in advance.
- Escape, Cancel and Close close it without acting. Focus returns to the row's Remove button.

## Copy

- **Heading:** Destinations
- **Intro:** The places your alerts can send notifications to.
- **Primary button:** Add Slack destination
- **Email row:** Account email; the address; Created with your account. It can't be removed.
- **Slack row:** the name; Slack · hooks.slack.com/…/x7Qa
- **Buttons:** Send test (pending: Sending…), Remove
- **Notices after a redirect:** "Slack destination added. Send a test to check it works." and "Slack destination removed." Both use the shared redirect-notice mechanism from increment 1.

## States

- **Loading:** the heading, intro and primary button render. The card shows two skeleton rows, each an icon block, two lines and a button block.
- **Empty:** cannot happen; every account has its email destination. With no Slack destinations the card has only the email row; the primary button is the invitation.
- **Error:** an error Notice in place of the card: "Couldn't load your destinations." with "Try again".

## Responsive

Below 640px each row stacks: the icon and text block first, then the buttons on their own line, left-aligned. The page head stacks too: the `h1`, the intro, then "Add Slack destination" on its own line. The page padding is 16px. The dialog is full width minus 24px margins.

## Components

Header, ListRow, Button (primary, outline, danger, destructive), Status, Notice, Dialog, Skeleton.
