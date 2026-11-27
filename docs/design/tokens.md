# Design tokens

The Heads-up design system, direction "Instrument room". Source of truth for the values: [tokens.json](tokens.json), exported from the [design system artifact](https://claude.ai/artifact/MUPxTygEj9oC6qAnR1pHV8). Rules for using them are in [README.md](README.md) and [components.md](components.md).

## Colour

Names match the shadcn variables in `src/app/globals.css`. The tokens below the line `ring` are additions the Contracts ticket must add, each with a `--color-<name>` entry in `@theme inline` so Tailwind classes such as `text-severity-high` and `bg-warning-muted` exist.

| Token                    | Light     | Dark      | Use                                                                                                                               |
| ------------------------ | --------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `background`             | `#F3F6F6` | `#0F1A1D` | Page canvas: the cool chart paper everything sits on.                                                                             |
| `foreground`             | `#14262C` | `#E6EEEE` | Body text and headings on background, card, muted, secondary and accent.                                                          |
| `card`                   | `#FFFFFF` | `#172529` | Raised surface: list containers, forms, the header, dialogs.                                                                      |
| `card-foreground`        | `#14262C` | `#E6EEEE` | Text on card.                                                                                                                     |
| `popover`                | `#FFFFFF` | `#172529` | Dialog, select menu and mobile menu panel surface.                                                                                |
| `popover-foreground`     | `#14262C` | `#E6EEEE` | Text on popover.                                                                                                                  |
| `primary`                | `#0D5C63` | `#5CC2C9` | Petrol. The one primary button per page, links, the active nav underline, the on switch. Readable as text on background and card. |
| `primary-foreground`     | `#FFFFFF` | `#06282C` | Text on primary.                                                                                                                  |
| `secondary`              | `#E4EBEB` | `#22353A` | Secondary button fill and keyword chips.                                                                                          |
| `secondary-foreground`   | `#14262C` | `#E6EEEE` | Text on secondary.                                                                                                                |
| `muted`                  | `#E9EFEF` | `#1D2E33` | Skeleton blocks, disabled field fill, the off switch track.                                                                       |
| `muted-foreground`       | `#52646B` | `#9DB0B4` | Supporting text, timestamps and hints on background, card, muted and secondary.                                                   |
| `accent`                 | `#DDE9E9` | `#22353A` | Hover fill for ghost buttons, nav links and menu items.                                                                           |
| `accent-foreground`      | `#14262C` | `#E6EEEE` | Text on accent.                                                                                                                   |
| `destructive`            | `#A3121A` | `#FF8A80` | Field errors, the failed status, destructive button text and fill. Readable as text on background, card and destructive-muted.    |
| `destructive-foreground` | `#FFFFFF` | `#3B0A0A` | Text on a destructive fill.                                                                                                       |
| `destructive-muted`      | `#FBE9E9` | `#3A1717` | Error notice background.                                                                                                          |
| `border`                 | `#D3DDDD` | `#2A3F44` | Hairlines between rows and around cards. Decorative: never the only boundary of a control.                                        |
| `input`                  | `#768B8B` | `#6A8388` | Boundary of inputs, selects, checkboxes and outline buttons. Holds 3:1 on card and background.                                    |
| `ring`                   | `#0D5C63` | `#5CC2C9` | Focus ring: 2px solid, 2px offset, on every interactive element.                                                                  |
| `severity-low`           | `#3F6485` | `#8FB4D9` | Severity mark and label, level 1 of 4. Text on card and background.                                                               |
| `severity-moderate`      | `#8A6100` | `#E5B84B` | Severity mark and label, level 2 of 4. Text on card and background.                                                               |
| `severity-high`          | `#B8440F` | `#FF9A66` | Severity mark and label, level 3 of 4. Text on card and background.                                                               |
| `severity-critical`      | `#A3121A` | `#FF7B7B` | Severity mark and label, level 4 of 4. Text on card and background.                                                               |
| `severity-track`         | `#D3DDDD` | `#2A3F44` | Unfilled bars of the severity mark. Decorative: the label carries the level.                                                      |
| `success`                | `#17663A` | `#6FCF97` | Sent status and success notice text. Text on card and success-muted.                                                              |
| `success-muted`          | `#E3F1E8` | `#14301F` | Success notice background.                                                                                                        |
| `warning`                | `#7A5600` | `#E5B84B` | Skipped status, and the Simulated badge and banner text. Text on card and warning-muted.                                          |
| `warning-muted`          | `#FBF1D9` | `#33290E` | Simulated badge and banner background.                                                                                            |

Every text token holds at least 4.5:1 on the surfaces its row names, and `input` and `ring` hold 3:1, in both themes. Computed with the WCAG 2 formula on 2026-11-27.

### Ready to paste

```css
:root {
  --background: #f3f6f6;
  --foreground: #14262c;
  --card: #ffffff;
  --card-foreground: #14262c;
  --popover: #ffffff;
  --popover-foreground: #14262c;
  --primary: #0d5c63;
  --primary-foreground: #ffffff;
  --secondary: #e4ebeb;
  --secondary-foreground: #14262c;
  --muted: #e9efef;
  --muted-foreground: #52646b;
  --accent: #dde9e9;
  --accent-foreground: #14262c;
  --destructive: #a3121a;
  --destructive-foreground: #ffffff;
  --destructive-muted: #fbe9e9;
  --border: #d3dddd;
  --input: #768b8b;
  --ring: #0d5c63;
  --severity-low: #3f6485;
  --severity-moderate: #8a6100;
  --severity-high: #b8440f;
  --severity-critical: #a3121a;
  --severity-track: #d3dddd;
  --success: #17663a;
  --success-muted: #e3f1e8;
  --warning: #7a5600;
  --warning-muted: #fbf1d9;
  --radius: 0.375rem;
}

.dark {
  --background: #0f1a1d;
  --foreground: #e6eeee;
  --card: #172529;
  --card-foreground: #e6eeee;
  --popover: #172529;
  --popover-foreground: #e6eeee;
  --primary: #5cc2c9;
  --primary-foreground: #06282c;
  --secondary: #22353a;
  --secondary-foreground: #e6eeee;
  --muted: #1d2e33;
  --muted-foreground: #9db0b4;
  --accent: #22353a;
  --accent-foreground: #e6eeee;
  --destructive: #ff8a80;
  --destructive-foreground: #3b0a0a;
  --destructive-muted: #3a1717;
  --border: #2a3f44;
  --input: #6a8388;
  --ring: #5cc2c9;
  --severity-low: #8fb4d9;
  --severity-moderate: #e5b84b;
  --severity-high: #ff9a66;
  --severity-critical: #ff7b7b;
  --severity-track: #2a3f44;
  --success: #6fcf97;
  --success-muted: #14301f;
  --warning: #e5b84b;
  --warning-muted: #33290e;
}
```

The starter also defines `--chart-*` and `--sidebar-*`; no screen uses them, so Contracts leaves or removes them. The dark theme follows the system setting, with no toggle: how `.dark` is applied (a media query variant or a class set from the preference) is a Contracts decision.

## Type

One family: **Schibsted Grotesk**, loaded with `next/font/google` as a variable font and exposed as `--font-sans`. It replaces Geist. Weights in use: 400, 500, 600, 700. Numbers are tabular (`tabular-nums`) in lists.

| Style     | Size / line height | Weight | Tracking | Tailwind                                | Use                                                                       |
| --------- | ------------------ | ------ | -------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `display` | 36px / 40px        | 700    | -0.02em  | `text-4xl font-bold tracking-tight`     | Landing headline only.                                                    |
| `title`   | 24px / 32px        | 600    | -0.02em  | `text-2xl font-semibold tracking-tight` | The one h1 of every page.                                                 |
| `heading` | 18px / 28px        | 600    | 0        | `text-lg font-semibold`                 | Section, dialog and empty-state headings.                                 |
| `body-lg` | 16px / 24px        | 400    | 0        | `text-base`                             | Landing copy, and text typed into fields.                                 |
| `body`    | 14px / 20px        | 400    | 0        | `text-sm`                               | Default UI text: rows, labels (at weight 500), buttons (at weight 600).   |
| `caption` | 12px / 16px        | 400    | 0        | `text-xs`                               | Chips, badges and credits. Never for hints or errors, which stay at body. |

## Spacing

The Tailwind 4px scale. No arbitrary values.

| Token      | Value | Tailwind                      | Use                                                                               |
| ---------- | ----- | ----------------------------- | --------------------------------------------------------------------------------- |
| `space-1`  | 4px   | `1` (as in `p-1`, `gap-1`)    | Icon to its label; between severity bars and the word.                            |
| `space-2`  | 8px   | `2` (as in `p-2`, `gap-2`)    | Label to its field; between chips; between buttons.                               |
| `space-3`  | 12px  | `3` (as in `p-3`, `gap-3`)    | Vertical padding of a list row.                                                   |
| `space-4`  | 16px  | `4` (as in `p-4`, `gap-4`)    | Horizontal padding of rows, cards and the page at 360px; gap between form fields. |
| `space-6`  | 24px  | `6` (as in `p-6`, `gap-6`)    | Page padding from 768px; gap between the page title and its content.              |
| `space-8`  | 32px  | `8` (as in `p-8`, `gap-8`)    | Between page sections.                                                            |
| `space-12` | 48px  | `12` (as in `p-12`, `gap-12`) | Empty-state vertical padding; landing sections.                                   |

## Radius

`--radius: 0.375rem` (6px). The starter has 0.625rem; Contracts changes it.

| Token       | Value | Tailwind     | Use                                         |
| ----------- | ----- | ------------ | ------------------------------------------- |
| `radius-sm` | 3.6px | `rounded-sm` | Chips, badges, checkboxes, skeleton blocks. |
| `radius-md` | 4.8px | `rounded-md` | Buttons, inputs, selects, notices.          |
| `radius-lg` | 6px   | `rounded-lg` | Cards, dialogs, the mobile menu panel.      |

Nothing is pill-shaped except the switch track.

## Shadow

| Token            | Light                            | Dark                         | Use                                                                            |
| ---------------- | -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `shadow-overlay` | `0 8px 24px rgba(20,38,44,0.18)` | `0 8px 24px rgba(0,0,0,0.5)` | Dialogs and the mobile menu panel only. Nothing in the page flow has a shadow. |

## Sizes that are not tokens

| What                             | Value                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Header height                    | 56px (`h-14`)                                                                                                                      |
| Button height                    | 36px (`h-9`); small 32px (`h-8`)                                                                                                   |
| Input, select, radio card height | 40px (`h-10`), typed text 16px                                                                                                     |
| Switch track                     | 32 by 18px in a 24px-high hit area                                                                                                 |
| Severity mark                    | four bars 4px wide, 2px apart, 5, 8, 11 and 14px high                                                                              |
| Icon                             | 16px, stroke 2 (Lucide)                                                                                                            |
| Page width                       | 880px (`max-w-4xl` is 896px: use it); forms 560px (`max-w-xl` is 576px: use it); account cards 420px (`max-w-md` is 448px: use it) |
| Breakpoints                      | rows stack below 640px (`sm`); the header collapses below 768px (`md`)                                                             |
