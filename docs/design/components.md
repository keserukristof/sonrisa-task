# Components

The components of the Heads-up design system, with the rules for using each. Live previews are in the [design system artifact](https://claude.ai/artifact/MUPxTygEj9oC6qAnR1pHV8); the same look is in the exported HTML under [html/](html/), styled by [html/ds/headsup/components/bundle.css](html/ds/headsup/components/bundle.css). The `hu-…` classes there are a reference for sizes and spacing, not something to copy into the app: the app builds each component from the shadcn/ui primitive named below and the tokens.

## shadcn/ui primitives the Contracts ticket adds

`button` (exists), `input`, `label`, `textarea`, `select` or `native-select`, `radio-group`, `checkbox`, `switch`, `badge`, `alert`, `alert-dialog`, `skeleton`, `card`, `sheet`. Check each name against the shadcn MCP before adding it. Icons come from `lucide-react`.

## Shared feature components the Contracts ticket creates in `src/components/`

`SeverityMark`, `NotificationStatus`, `SimulatedBadge`, `EmptyState`, `Notice` (a thin wrapper over `alert`), `AppHeader`, `Pager`. More than one feature uses each.

## Button

One action, named by its outcome. Five variants: primary, outline, ghost, danger (outline with destructive text) and destructive (solid).

- **One primary button per page.** It is the page's main action: "Create alert", "Save changes", "Sign in", "Create simulated event". Everything else is outline or ghost.
- **Labels are verbs that name the outcome**, in sentence case: "Create alert", never "Submit" or "OK".
- **Pending:** while a Server Action runs, the button is disabled and its label changes to the pending form: "Saving…", "Signing in…", "Sending…", "Deleting…".
- **Danger** opens a confirmation; **destructive** is the confirming button inside the dialog, and names the thing: "Delete alert".
- Height 36px; the small size (32px) is for actions inside a list row. Radius `radius-md`. Focus ring: 2px `ring`, 2px offset.
- Maps to shadcn `button`: default, outline, ghost, destructive; danger is outline with `text-destructive`.

## Switch

Pauses and resumes one alert from its row, in one click.

- The word next to the track says the state: "Active" or "Paused". The state is never colour alone.
- Its accessible name includes the alert: "Pacific rim quakes is active".
- It changes immediately and reverts with an inline error if the action fails.
- Track 32 by 18px inside a 24px-high hit area; on is `primary`, off is `input`.
- Maps to shadcn `switch`.

## Field

A labelled control with an optional hint and an error. Covers text inputs, selects, the category radio group and the destinations checkbox group.

- **Every field has a visible label above it.** A placeholder is an example of valid input, never the label.
- **Optional fields say so** in the label: "Keywords (optional)". Required is the default and is not marked.
- **Hint** sits under the control in `muted-foreground` at body size, linked with `aria-describedby`.
- **Error** replaces the hint: `destructive` text with an icon, the control gets a `destructive` border and `aria-invalid`. Validate on submit; focus moves to the first invalid field; typed values stay.
- **Disabled** (news severity): `muted` fill, and the hint explains why.
- Controls are 40px high with 16px text, so phones do not zoom on focus. Boundary is `input`, which holds 3:1.
- Radio and checkbox groups are a `fieldset` with a `legend`; a group error sits under the group.
- Maps to shadcn `input`, `label`, `select` (native), `radio-group`, `checkbox`, `textarea`.

## Severity

The severity mark: four rising bars with the level's word. The only saturated colour in the interface.

- **Always bars and word together.** The word carries the level; the bars and colour only speed up scanning.
- Levels, lowest first: Low, Moderate, High, Critical. Colours: `severity-low`, `severity-moderate`, `severity-high`, `severity-critical`; unfilled bars are `severity-track`.
- **On an event** the label is the level: "High".
- **On an alert** the label is its minimum: "Low and above", "Moderate and above", "High and above", "Critical only".
- **News alerts** have no minimum: show "Any severity" in `muted-foreground`, with no bars.
- Do not use these four colours for anything except severity.
- No shadcn primitive: a feature component in `src/components/`, since alerts, notifications and admin all use it.

## Status

Notification status, keyword chips and the Simulated badge.

- **Status** is an icon and a word: Pending (clock, `muted-foreground`), Sent (check, `success`), Failed (cross, `destructive`), Skipped (barred circle, `warning`).
- A reason follows on the next line in `muted-foreground`: "Next attempt at 12:05 UTC", "Hourly limit (10) reached", "Daily system limit (80) reached", or the last error.
- **Keyword chip:** `secondary` fill, caption size. One per keyword, in the order saved.
- **Simulated badge:** `warning-muted` fill with a `warning` outline and a flask icon. It appears next to the title of every simulated event, everywhere.
- Maps to shadcn `badge` for chips and the Simulated badge; status is a feature component.

## Notice

An inline message in the page flow. There are no toasts in Heads-up.

- **Success** (`success-muted`, `role="status"`): confirms what just happened, in the past tense. "Email confirmed.", "Alert created.", "Event created. The next tick, within a minute, matches and delivers it."
- **Error** (`destructive-muted`, `role="alert"`): says what failed and what to do. A data view that failed to load shows "Couldn't load your alerts." with a "Try again" button; a failed Server Action shows its message under the form.
- **Simulated** (`warning-muted`): the banner that opens a simulated event's email.
- Every notice has an icon, so the kind is never colour alone.
- Placement: page-level notices sit between the page title and the content; form-level errors sit directly above the submit button.
- Maps to shadcn `alert`.

## Dialog

Confirmation before a destructive action. Used once in increment 1: deleting an alert.

- The title names the thing in quotes and ends with a question mark: Delete "Pacific rim quakes"?
- The body says what happens and what stays: "It stops matching events. Past notifications stay in your history."
- Buttons: "Cancel" (outline, focused on open) then the destructive button, which repeats the verb and the noun: "Delete alert". Pending label: "Deleting…".
- Escape and Cancel close it without acting. Focus returns to the row's Delete button.
- Surface `popover`, radius `radius-lg`, `shadow-overlay`; max width 420px; full width minus 24px margins at 360px.
- Maps to shadcn `alert-dialog`. Never hand-rolled.

## Skeleton

The loading state of a data view: blocks in the shape of the content that is coming.

- It is the `<Suspense>` fallback of the view, with the same card, row heights and padding as the loaded list, so nothing shifts when data arrives.
- Three rows for a list; one row for the destinations page.
- Blocks are `muted`, radius `radius-sm`, and pulse gently; the pulse stops under `prefers-reduced-motion`.
- The container has `aria-busy="true"` and a label such as "Loading alerts". The page title and the primary button render immediately, outside the skeleton.
- Maps to shadcn `skeleton`.

## EmptyState

What a data view shows when it has nothing yet: what belongs here and the action that fills it.

- A heading that invites the action, one or two sentences in `muted-foreground` (max 44 characters wide), and one primary button when there is an action.
- **Alerts:** "Create your first alert". "An alert tells you when an event in a category you choose reaches a severity you choose. Your account email is ready as a destination." Button: "Create alert". The page head's own "Create alert" button is hidden in this state, so the page still has one primary button.
- **Notifications:** "No notifications yet". "They appear here once one of your alerts matches an event." Link: "Go to alerts".
- Sits inside the same card the list would use; 48px vertical padding.
- No shadcn primitive needed; a small shared component in `src/components/`.

## ListRow

One item in a list: an alert or a notification. Rows sit in one card, separated by hairlines.

- Left: the title at weight 600, then one supporting line in `muted-foreground`. Right: the severity mark, then state and actions.
- **Alert row:** name; "Natural disasters, to Account email"; keyword chips; minimum severity; the Active switch; Edit; Delete.
- **Notification row:** event title with the Simulated badge when it applies; the event time in UTC; the alert name ("Deleted alert" in `muted-foreground` when it is gone); the destination; the event's severity; the status with its reason.
- Padding 12px by 16px. No hover fill: rows are not links; only the controls inside them act.
- **Below 640px** the row stacks: text first, severity under it, then the state and actions on one line. No horizontal scroll at 360px.
- Lists are `<ul>` with one `<li>` per row. Maps to shadcn `card` for the container.

## Header

The header of every signed-in page: the wordmark, the main navigation and sign out.

- Links, in order: Alerts, Notifications, Destinations, and Admin for admins only. The current page has `aria-current="page"`, weight 600 and a 2px `primary` underline.
- Right side: the account email in `muted-foreground`, then "Sign out" (ghost).
- The wordmark links to `/alerts`. It is the trace mark in `primary` followed by "Heads-up" at weight 700.
- Height 56px, surface `card`, a `border` hairline below.
- **Below 768px** the links collapse into a "Menu" button (outline, with the word, not an icon alone). It opens a panel from the right with the same links at 44px height, the email, and Sign out. Choosing a link closes it.
- **Signed out** (landing, sign in, sign up): the wordmark, then "Sign in" (ghost) and "Sign up" (outline) on the right.
- Maps to shadcn `sheet` for the menu panel.

## Pager

Previous and Next links under a list that has more than one page.

- Plain links on `?page=`, styled as small outline buttons, so they work without JavaScript.
- 25 rows a page. "Page 2" between them in `muted-foreground`.
- On the first page "Previous" is not rendered; on the last page "Next" is not rendered. With one page there is no pager.
- Inside a `nav` with `aria-label="Pagination"`.

## Increment 2 additions

Shared components added for increment 2. Their exact look is at the end of [html/ds/headsup/components/bundle.css](html/ds/headsup/components/bundle.css) (`hu-tabs`, `hu-filter`, `hu-meter`). They were added to the canvas's stylesheet; the design system artifact is unchanged, and the next design run adds them there.

### Tabs

Section navigation inside the admin area.

- A `nav` (`aria-label="Admin"`) of links, one per route; the current one has `aria-current="page"`. Not an ARIA tablist: each tab is a page.
- Height 40px, padding 0 12px, weight 500 in `muted-foreground`; current: `foreground`, weight 600, 2px `primary` underline over a 1px `border` baseline.
- Scrolls sideways inside its own container when it does not fit; the page does not.
- No shadcn `tabs` primitive (that one is client-side panels). A small shared `AdminTabs` component in `src/components/` or the admin feature.

### Filter

A choice among a few values of one query parameter, as links.

- A label ("Status") then a group of links in a 1px `border` box, radius `radius-md`, 3px inner padding. Each link: height 28px, padding 0 10px, radius `radius-sm`; current: `accent` fill, `foreground`, weight 600, `aria-current="page"`.
- Works without JavaScript. Used once: the admin notifications status filter.
- A feature component in the admin feature folder.

### Meter

How much of a fixed amount is used.

- 8px tall, radius 4px, track `muted`, fill `foreground`. No colour change: the numbers next to it say the state.
- `role="img"` with a label that repeats the numbers. Used once: the email budget.

### Broken mark

Marks a broken Slack destination wherever it is named: the unplug icon (lucide `unplug`) and the word ("Broken" or "<name> (broken)") in `destructive`, weight 600. Part of the destinations feature; the alerts feature needs it too, so it moves to `src/components/` (`BrokenMark`).

### Source credit

The credit line for an event's source: "U.S. Geological Survey", "Source: The Guardian", "Powered by CoinGecko", nothing for simulated events. Caption size, `muted-foreground`. One function maps a source to its credit, used by history rows, the admin events list, the email footer and the Slack context line (`src/lib`, since email and Slack rendering need it outside React).
