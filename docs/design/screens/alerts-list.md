# Alerts list

- **Route:** `/alerts`. Signed-out visitors go to `/sign-in?next=/alerts`.
- **Purpose:** show what the user is covered for, and let them pause, edit, delete and create alerts.
- **Primary action:** "Create alert".
- **Data:** the user's alerts, newest first, each with its destinations.
- **Artboards:** [Main](../html/Main.dc.html), [AlertsEmpty](../html/AlertsEmpty.dc.html), [AlertsLoading](../html/AlertsLoading.dc.html), [AlertsError](../html/AlertsError.dc.html), [AlertsDelete](../html/AlertsDelete.dc.html), [MobileAlerts](../html/MobileAlerts.dc.html), [DarkAlerts](../html/DarkAlerts.dc.html)

## Layout, top to bottom

1. **App header**, "Alerts" current. See [app-header.md](app-header.md).
2. **Main**, at most 880px wide, centred, 24px padding:
   - **Page head:** the `h1` "Alerts" on the left, "Create alert" (primary, links to `/alerts/new`) on the right, 24px above the content.
   - **Page notice**, only when present: between the page head and the list, 24px above the list.
   - **The list:** one card holding a `<ul>`, one `<li>` row per alert, hairlines between rows.

## One alert row

Left to right, 16px apart, vertically centred, padded 12px by 16px:

1. **Text block**, taking the free width:
   - The alert name at weight 600.
   - One line in `muted-foreground`: the category, then the destinations: "Natural disasters, to Account email". Several destinations are joined with commas.
   - Keyword chips 6px below, 6px apart, only when the alert has keywords.
2. **Severity mark**, in a 170px column so marks align down the list: the alert's minimum as "Low and above", "Moderate and above", "High and above" or "Critical only". A news alert shows "Any severity" in `muted-foreground` with no bars.
3. **Active switch** with its word: "Active" or "Paused". Accessible name: "<name> is active" or "<name> is paused".
4. **Edit** (outline, small), linking to `/alerts/<id>/edit`.
5. **Delete** (danger, small), opening the dialog.

A paused alert's row is not dimmed; only the switch and its word change.

## Copy

- **Heading:** Alerts
- **Button:** Create alert
- **Category names:** News; Markets; Natural disasters
- **Row actions:** Edit; Delete

## States

- **Loading:** the page head renders at once, with the button. The card shows three skeleton rows in the row's shape: a 16px-high title block and a 14px line on the left, then blocks for the severity mark, the switch and the two buttons. `aria-busy="true"`, `aria-label="Loading alerts"`.
- **Empty:** the "Create alert" button in the page head is not rendered. The card holds the empty state:
  - A bell icon, 24px, in `primary`.
  - Heading: Create your first alert
  - Text: An alert tells you when an event in a category you choose reaches a severity you choose. Your account email is ready as a destination.
  - Button (primary): Create alert
- **Error:** the page head renders. In place of the card, an error Notice:
  - Couldn't load your alerts. (weight 600)
  - Your alerts are still saved and still running. Check your connection and try again.
  - Button (outline, small): Try again. It re-renders the list section.
- **Page notices** (success Notice, `role="status"`):
  - After the confirmation link: Email confirmed.
  - After creating: Alert created.
  - After saving an edit: Changes saved.
  - After deleting: Alert deleted.
- **Switch failure:** the switch returns to its previous state and an error Notice appears above the list: "Couldn't pause the alert. Try again." or "Couldn't resume the alert. Try again."

## Delete dialog

An `alert-dialog` centred over the dimmed page, at most 420px wide:

- **Title:** Delete "<alert name>"?
- **Body** (`muted-foreground`): It stops matching events. Past notifications stay in your history.
- **Buttons**, right-aligned: "Cancel" (outline, focused on open), "Delete alert" (destructive). Pending: "Deleting…".

Cancel and Escape close it without acting. On success the dialog closes, the row is gone and the "Alert deleted." notice shows. On failure the dialog stays open with an error line above the buttons: "Couldn't delete the alert. Try again."

## Responsive

Below 640px each row stacks, 10px between its parts:

1. The text block, with chips.
2. The severity mark.
3. One line with the switch on the left and Edit and Delete on the right.

The page padding is 16px, and the page head keeps the heading and the button on one row. No horizontal scrolling at 360px.

## Components

Header, Button, ListRow, Severity, Switch, Status chips, Notice, Dialog, Skeleton, EmptyState.
