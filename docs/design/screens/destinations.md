# Destinations

- **Route:** `/destinations`.
- **Purpose:** show where notifications can be sent, and let the user check that a destination works.
- **Primary action:** "Send test" (outline: it is a row action, and the page has no primary button in this increment).
- **Data:** the user's destinations. In increment 1 that is exactly one: the account email.
- **Artboard:** [html/Destinations.dc.html](../html/Destinations.dc.html) (shown after a delivered test)

## Layout, top to bottom

1. **App header**, "Destinations" current.
2. **Main**, at most 880px wide, centred, 24px padding:
   - The `h1` "Destinations", 8px above the intro.
   - An intro line in `muted-foreground`, 24px above the list.
   - One card holding a `<ul>` with one row per destination.

## The email destination row

Top-aligned, 16px apart, padded 12px by 16px:

1. A mail icon, 20px, in `muted-foreground`.
2. A text block taking the free width:
   - "Account email" at weight 600.
   - The account's address.
   - A line in `muted-foreground`.
   - The test result, 10px below, only after a test.
3. "Send test" (outline, small).

There is no remove control on this row, and no placeholder for Slack: Slack destinations arrive in increment 2.

## Copy

- **Heading:** Destinations
- **Intro:** The places your alerts can send notifications to.
- **Row:** Account email; the address; Created with your account. It can't be removed.
- **Button:** Send test. Pending: Sending…

## Test result

Shown inline in the row with `role="status"`, replacing any earlier result:

| Outcome               | Display                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Delivered             | Sent status style (check, `success`): Delivered at 13:55 UTC                                   |
| Refused, hourly limit | Skipped status style (barred circle, `warning`): Not sent. You've reached 10 emails this hour. |
| Refused, daily limit  | Skipped status style: Not sent. Heads-up has reached its 80 emails for today.                  |
| Failed                | Failed status style (cross, `destructive`): Couldn't send the test. Try again in a minute.     |

While the test is being sent, the button is disabled and reads "Sending…". The test is sent at once by the Server Action; it does not wait for a tick and does not appear in notification history.

## States

- **Loading:** the heading and intro render. The card shows one skeleton row: an icon block, two lines, a button block.
- **Empty:** cannot happen; every account has its email destination.
- **Error:** an error Notice in place of the card: "Couldn't load your destinations." with "Try again".

## Responsive

Below 640px the row stacks: the icon and text block first, then "Send test" on its own line, left-aligned. The page padding is 16px.

## Components

Header, ListRow, Button, Status, Skeleton, Notice.
