# Simulate an event

- **Route:** `/admin/simulate`. `/admin` redirects here. A signed-in non-admin, or a signed-out visitor, gets the not-found page.
- **Purpose:** let an admin create a simulated event, to prove the whole path works without waiting for a real one.
- **Primary action:** "Create simulated event".
- **Artboard:** [html/Simulate.dc.html](../html/Simulate.dc.html) (shown after an event was created)

## Layout, top to bottom

1. **App header**, "Admin" current.
2. **Main**, at most 560px wide, centred, 24px padding:
   - The `h1`, 8px above the intro.
   - An intro paragraph in `muted-foreground`, 24px above what follows.
   - The success Notice, only after an event was created, 24px above the card.
   - One card with 24px padding, fields 24px apart, in this order:
     1. Category
     2. Severity
     3. Title
     4. Summary
     5. Link
     6. The server error Notice, only when present
     7. The primary button

## Fields

| Field    | Control                                                                 | Default     | Rules                                            |
| -------- | ----------------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| Category | Radio group as three bordered options: News, Markets, Natural disasters | none chosen | Required                                         |
| Severity | Select: Low, Moderate, High, Critical                                   | High        | Required. For News it is set to Low and disabled |
| Title    | Text input                                                              | empty       | Required, 1 to 200 characters after trimming     |
| Summary  | Textarea, 80px high                                                     | empty       | Optional, up to 1000 characters                  |
| Link     | Text input, `type="url"`                                                | empty       | Optional; must be an `http` or `https` URL       |

There is no source field: the source is always the reserved "simulated" source.

## Copy

- **Heading:** Simulate an event
- **Intro:** A simulated event is matched and delivered exactly like a real one. It is marked as simulated everywhere, including in the email.
- **Labels:** Category; Severity; Title; Summary (optional); Link (optional)
- **Severity hint when News is chosen:** News events are always low severity.
- **Link placeholder:** https://example.com/report
- **Button:** Create simulated event. Pending: Creating…
- **Success Notice:** Event created. The next tick, within a minute, matches and delivers it. See your notifications

"See your notifications" links to `/notifications`.

## Field errors

| Field    | Condition            | Message                                |
| -------- | -------------------- | -------------------------------------- |
| Category | none chosen          | Choose a category.                     |
| Title    | empty                | Enter a title for the event.           |
| Title    | over 200 characters  | Use 200 characters at most.            |
| Summary  | over 1000 characters | Use 1000 characters at most.           |
| Link     | not an http(s) URL   | Enter a link that starts with https:// |

They behave as in [alert-form.md](alert-form.md): under the field, on submit, focus to the first invalid field, typed values kept.

## Other states

- **Server error on submit:** an error Notice above the button, `role="alert"`: "Couldn't create the event. Nothing was changed. Try again."
- **Pending:** the button is disabled and reads "Creating…".
- **Success:** the page stays, the form resets to its defaults, and the success Notice shows above the card with `role="status"`.
- No loading or empty state: the page loads no list.

## Responsive

Below 640px the page and card padding are 16px, the three category options stack, and the button is full width.

## Components

Header, Field (radio group, select, input, textarea), Button, Notice.

## Increment 2: under the admin tabs

Artboard: [html/Simulate2.dc.html](../html/Simulate2.dc.html), screenshot `2-simulate2.png`.

- The page joins the admin frame ([admin-overview.md](admin-overview.md)): the `h1` is now "Admin", the tabs follow with Simulate current, and "Simulate an event" becomes an `h2` at the top of the 560px-wide form column. The intro, the form, its copy and its states do not change.
- `/admin` no longer redirects here; it is the overview.
- The success Notice's link "See your notifications" is unchanged.
