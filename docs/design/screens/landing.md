# Landing

- **Route:** `/`, for a signed-out visitor. A signed-in user who opens `/` is redirected to `/alerts`.
- **Purpose:** say what Heads-up does and get the visitor to sign up or sign in.
- **Primary action:** "Sign up".
- **Artboard:** [html/Landing.dc.html](../html/Landing.dc.html)

## Layout, top to bottom

1. **Signed-out header** (56px, `card`, hairline below): the wordmark on the left, linking to `/`. On the right, "Sign in" (ghost, small) then "Sign up" (outline, small).
2. **Main**, at most 1040px wide, centred, 72px above and below, two columns with a 48px gap, vertically centred:
   - **Left column:**
     - The `h1` in `display`.
     - A paragraph in `body-lg`, `muted-foreground`, at most 46 characters wide, 16px below the heading.
     - A button row 24px below: "Sign up" (primary), "Sign in" (outline).
   - **Right column:**
     - A card with a header row and four rows, one per severity level: the Severity mark (110px wide) and the magnitude range.
     - A caption in `caption`, `muted-foreground`, 12px below the card.

## Copy

- **Heading:** Hear about the earthquake, not the whole news cycle.
- **Paragraph:** Heads-up watches for events in the world. You choose the category and how severe an event has to be, and it emails you when one arrives.
- **Card header:** One scale for every event
- **Rows:**
  - Low: Magnitude 4.5 to 5.4
  - Moderate: Magnitude 5.5 to 6.4
  - High: Magnitude 6.5 to 7.4
  - Critical: Magnitude 7.5 and above
- **Caption:** Earthquakes of magnitude 4.5 and above, from the U.S. Geological Survey, checked every minute.

The page names only earthquakes, because they are the only real source in increment 1. Increment 2 adds news and markets here.

## Components

Header (signed out), Button, Severity, a card with list rows.

## States

Static: no data is loaded, so there is no loading, empty or error state.

## Responsive

The two columns wrap: below about 860px the card moves under the text and both take the full width. At 360px the page padding is 16px, the top padding drops to 48px, and the two buttons stay on one row.
