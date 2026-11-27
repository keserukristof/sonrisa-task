# Alert form

- **Routes:** `/alerts/new` and `/alerts/<id>/edit`. Another user's alert, or an unknown id, gives the not-found page.
- **Purpose:** create an alert, or change one.
- **Primary action:** "Create alert" on new, "Save changes" on edit.
- **Data:** the user's destinations; on edit, the alert.
- **Artboards:** [AlertForm](../html/AlertForm.dc.html), [AlertFormErrors](../html/AlertFormErrors.dc.html), [MobileAlertForm](../html/MobileAlertForm.dc.html)

The `AlertFormErrors` artboard shows the news category, three field errors, the server error and the pending button all at once, to document them. They do not normally appear together, and the sentence under the form on that artboard is a note, not part of the screen.

## Layout, top to bottom

1. **App header**, "Alerts" current.
2. **Main**, at most 560px wide, centred, 24px padding:
   - A link "Back to alerts" to `/alerts`, 8px above the heading.
   - The `h1`, 24px above the card.
   - One card with 24px padding, fields 24px apart, in this order:
     1. Name
     2. Category
     3. Minimum severity
     4. Keywords
     5. Destinations
     6. The server error Notice, only when present
     7. The button row: the primary button, then "Cancel" (outline, links to `/alerts`)

## Fields

| Field            | Control                                                                                             | Default on new           | Rules                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Name             | Text input                                                                                          | empty                    | Required, 1 to 80 characters after trimming                                                               |
| Category         | Radio group shown as three bordered options in a row: News, Markets, Natural disasters              | none chosen              | Required. The chosen option has a `primary` border                                                        |
| Minimum severity | Select: "Low and above", "Moderate and above", "High and above", "Critical only"                    | Moderate and above       | Disabled when the category is News                                                                        |
| Keywords         | Text input, comma-separated                                                                         | empty                    | Optional. Trimmed, lowercased, de-duplicated, empty entries dropped. At most 10, each up to 40 characters |
| Destinations     | Checkbox group, one per destination: the destination's name, then its address in `muted-foreground` | the account email ticked | At least one. Only the user's own destinations are listed                                                 |

On edit every field is filled from the alert. Keywords stay when the category changes. Switching away from News re-enables the severity select at "Moderate and above", or at the alert's saved value on edit.

## Copy

- **Headings:** Create alert; Edit alert
- **Labels:** Name; Category; Minimum severity; Keywords (optional); Destinations
- **Severity hint:** You hear about events at this level or higher.
- **Severity, when News is chosen:** the select shows "Not used for news", and the hint reads: News has no severity levels; every article matches. Use keywords to narrow it.
- **Keywords hint:** Separate with commas. Every keyword must appear in the event as a whole word. Up to 10.
- **Keywords placeholder:** japan, tsunami
- **Destination row:** Account email you@example.com
- **Buttons:** Create alert (pending: Creating…); Save changes (pending: Saving…); Cancel
- **Link:** Back to alerts

## Field errors

Each shows under its field in `destructive` with the alert icon, replaces the hint, and is linked with `aria-describedby`. The control gets a `destructive` border and `aria-invalid`.

| Field        | Condition                     | Message                                      |
| ------------ | ----------------------------- | -------------------------------------------- |
| Name         | empty                         | Enter a name for this alert.                 |
| Name         | over 80 characters            | Use 80 characters at most.                   |
| Category     | none chosen                   | Choose a category.                           |
| Keywords     | more than 10                  | Use 10 keywords at most. You entered <n>.    |
| Keywords     | one longer than 40 characters | Keep each keyword to 40 characters or fewer. |
| Destinations | none ticked                   | Choose at least one destination.             |

Validation runs on submit with the shared Zod schema, on the client and again in the Server Action. Focus moves to the first invalid field. Everything typed stays.

## Other states

- **Loading** (edit only): the heading renders; the card shows five skeleton blocks in the shape of the fields.
- **Error loading** (edit only): an error Notice in place of the card: "Couldn't load this alert." with "Try again".
- **Server error on submit:** an error Notice directly above the buttons, `role="alert"`: "Couldn't save the alert. Nothing was changed. Try again."
- **Pending:** the primary button is disabled with its pending label.
- **Success:** redirect to `/alerts` with the notice "Alert created." or "Changes saved.".

## Responsive

Below 640px the page padding and the card padding are 16px. The three category options stack, each full width. The address in a destination row moves to a second line under the name. The two buttons stack, each full width, the primary one first.

## Components

Header, Field (input, radio group, select, checkbox group), Button, Notice, Skeleton.

## Increment 2: Slack destinations and the news keyword rule

Artboards: [html/AlertForm2.dc.html](../html/AlertForm2.dc.html) (create, News, with Slack destinations), [html/AlertFormNewsError.dc.html](../html/AlertFormNewsError.dc.html) (edit, News with no keyword). Screenshots `2-alert-form2.png`, `2-alert-form-news-error.png`. Everything above still holds unless this section changes it.

### Destinations

- One checkbox per destination, in the order of `/destinations`: "Account email" first, then each Slack destination by name.
- Each label is the name, then the kind in `muted-foreground`: "Account email you@example.com", "Ops channel Slack".
- A broken destination keeps its checkbox, enabled, followed by the unplug icon and "Broken" in `destructive`. It can still be chosen (the user may be about to fix it), but nothing reaches it while broken.
- "Choose at least one destination." still applies.

### Keywords for news

- When the category is **News**, the Keywords label loses "(optional)" and the hint begins "Required for news.": "Required for news. Separate with commas. Every keyword must appear in the event as a whole word. Up to 10." For Markets and Natural disasters the label and hint stay as in increment 1.
- Submitting a news alert with no keyword shows, under the hint: "News alerts need at least one keyword, or every article would notify you." The input gets `aria-invalid`, and focus moves to it.
- The database enforces the same rule; if it refuses anyway, the form shows the same sentence.
- The label change is client-side when JavaScript runs; without it the field reads "Keywords" with the increment 1 hint, and the server's error still explains.

### Copy, added

- Keywords hint, News: Required for news. Separate with commas. Every keyword must appear in the event as a whole word. Up to 10.
- Keywords error, News: News alerts need at least one keyword, or every article would notify you.
- Broken mark: Broken
