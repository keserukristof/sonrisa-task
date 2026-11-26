---
paths:
  - "src/**/*.tsx"
  - "src/app/globals.css"
---

# UI and UX rules

The approved design in `docs/design/` is the source of truth for look, layout and copy. These rules cover what a design file does not show.

## Design tokens

- Use the semantic tokens from `src/app/globals.css`: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-destructive`.
- No raw hex colours, no arbitrary values (`w-[437px]`, `text-[13px]`) and no palette classes (`bg-zinc-100`) in feature code. If a token is missing, that is a design-system change and belongs to the Contracts ticket.
- Spacing and radius come from the Tailwind scale and the `--radius` tokens.

## Components

- Build from the shadcn/ui primitives in `src/components/ui/`. Check the shadcn MCP for the current API before using one.
- Do not hand-roll dialogs, menus, selects, tooltips or toasts. The primitives handle focus and keyboard behaviour correctly.
- New primitives are added in the Contracts ticket, not inside an implementation ticket.
- Feature components live in their feature folder; a component used by two features moves to `src/components/`.

## Four states for every data view

1. **Loading**: a skeleton with the shape of the final content, as the `<Suspense>` fallback. No layout shift when data arrives.
2. **Empty**: say what belongs here and offer the primary action that fills it.
3. **Error**: say what failed in plain words and offer retry. Never show a stack trace or a raw database message.
4. **Success**: the designed view.

## Forms

- Every field has a visible `<label>`. Placeholders are examples, not labels.
- Validate on submit with the shared Zod schema; show each error next to its field, linked with `aria-describedby`, and move focus to the first invalid field.
- Keep what the user typed when submission fails.
- The submit button shows a pending label ("Saving…") and is disabled while pending.
- Confirm success visibly: a toast, an inline message, or navigation to the result.
- Destructive actions ask for confirmation and name what will be deleted.

## Feedback and navigation

- Every action gets a visible response immediately: a pending state first, the result after.
- The current location is always evident: page title, active navigation item, and a way back.
- Button labels are verbs that name the outcome: "Create project", not "Submit" or "OK".

## Accessibility: WCAG 2.2 AA

- Semantic HTML first: one `<h1>` per page, headings in order, landmarks (`<main>`, `<nav>`, `<header>`), real `<button>` and `<a>` elements.
- Everything works with the keyboard alone, in a logical order, with a visible focus ring.
- Text contrast at least 4.5:1, large text and UI boundaries at least 3:1.
- Interactive targets are at least 24 by 24 CSS pixels.
- Never signal state by colour alone: add text or an icon.
- Images have meaningful `alt` text, or `alt=""` when decorative. Icon-only buttons have an accessible name.
- Status changes are announced: `role="status"` for updates, `role="alert"` for errors.
- Respect `prefers-reduced-motion`.

## Responsive

- Design mobile-first from 360px wide. No horizontal scrolling at any width.
- Tables with many columns become stacked cards or scroll inside their own container on small screens.
- The Playwright `mobile` project must pass for every user-facing flow.

## Copy

Sentence case. Short, specific, in the user's words. Error messages say what happened and what to do next.

## Performance

`next/image` for images, `next/font` for fonts, Server Components for anything static.
