# Design

The approved design system and screens, exported by the `/design` phase. Implementers work in git worktrees and build from these files; they cannot open the artifacts.

## What is here

| File                                 | What it holds                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| [tokens.md](tokens.md)               | Every colour token in light and dark, the type scale, spacing, radius, shadow |
| [tokens.json](tokens.json)           | The same tokens as data, exactly as the design system artifact holds them     |
| [components.md](components.md)       | The 12 components, their rules, and the shadcn/ui primitive each maps to      |
| [screens/](screens/)                 | One file per screen: layout, components, states, exact copy, responsive rules |
| [html/](html/)                       | The artboards as HTML, with the stylesheet they use                           |
| [html/ds/headsup/](html/ds/headsup/) | `tokens.css` and `components/bundle.css`: exact sizes and spacing to read off |

Each artboard also has a screenshot of its exported HTML in `screens/`, named `1-<artboard>.png` (increment 1), for example [screens/1-main.png](screens/1-main.png) and [screens/1-mobile-alerts.png](screens/1-mobile-alerts.png).

The files under `html/` are the canvas's own `.dc.html` sources. Serve the folder over HTTP and open one in a browser to see the screen (opened as a file, the stylesheet links may not load): the canvas runtime (`support.js`) is missing locally, so links between artboards and the editor do not work, but the markup and the styles render.

## Artifacts

Both are private to the author; reviewers read the export above.

- Design system: https://claude.ai/artifact/MUPxTygEj9oC6qAnR1pHV8
- Increment 1 screens: https://claude.ai/artifact/ECNw5zuTQq3tNbr7ynQCiX

## The direction: Instrument room

Heads-up tells a person when something in the world reaches the severity they chose. The interface is quiet, precise and nearly colourless, like a monitoring station, so that severity is the loudest thing on any screen.

- **Quiet until it matters.** Chrome is `background`, `card`, `foreground` and `muted-foreground`. Saturated colour means severity or a notification status, never decoration.
- **Say it in words.** Every state has a word next to its mark: "High", "Sent", "Paused", "Simulated". Colour and icons only speed up scanning.
- **One primary action per page**, in `primary` (petrol). Everything else is outline or ghost.
- **Hairlines, not shadows.** Only dialogs and the mobile menu panel have a shadow.
- **One typeface:** Schibsted Grotesk, a grotesque drawn for news media. Small corners (6px), no pills except the switch.

Chosen by the user over two other directions, "Signal flags" (navy and signal yellow, thick outlines) and "Night watch" (dark-first with an amber accent): see the decision log, 2026-11-27. The agent's case for it was that history and admin lists dominate the product, and that yellow or amber chrome would compete with the severity colours.

## Rules for every screen

- **Words:** use the glossary's terms exactly. Sentence case. No exclamation marks, no "please", no "successfully".
- **Times:** always UTC and labelled: "27 Nov 2026, 13:42 UTC"; a time on the same day as the row's date may be short: "13:43 UTC".
- **Feedback is inline**, in a Notice. There are no toasts.
- **Four states for every data view:** a skeleton in the shape of the content, an empty state that invites the action, an error card with "Try again", and the designed view.
- **Dark theme** follows the system setting. There is no toggle. `html/DarkAlerts.dc.html` shows it.
- **Responsive:** designed from 360px. Rows stack below 640px; the header collapses to a Menu button below 768px.

## Screens

| Screen                   | File                                                     | Route                              | Artboards in `html/`                                                                                |
| ------------------------ | -------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Landing                  | [screens/landing.md](screens/landing.md)                 | `/`                                | `Landing`                                                                                           |
| Sign up                  | [screens/sign-up.md](screens/sign-up.md)                 | `/sign-up`                         | `SignUp`                                                                                            |
| Waiting for confirmation | [screens/sign-up-confirm.md](screens/sign-up-confirm.md) | `/sign-up/confirm`                 | `SignUpConfirm`                                                                                     |
| Sign in                  | [screens/sign-in.md](screens/sign-in.md)                 | `/sign-in`                         | `SignIn`                                                                                            |
| Expired or used link     | [screens/link-expired.md](screens/link-expired.md)       | the confirmation route's error     | `LinkExpired`                                                                                       |
| App header               | [screens/app-header.md](screens/app-header.md)           | every signed-in page               | `Main`, `MobileAlerts`, `MobileMenu`                                                                |
| Alerts list              | [screens/alerts-list.md](screens/alerts-list.md)         | `/alerts`                          | `Main`, `AlertsEmpty`, `AlertsLoading`, `AlertsError`, `AlertsDelete`, `MobileAlerts`, `DarkAlerts` |
| Alert form               | [screens/alert-form.md](screens/alert-form.md)           | `/alerts/new`, `/alerts/<id>/edit` | `AlertForm`, `AlertFormErrors`, `MobileAlertForm`                                                   |
| Notification history     | [screens/notifications.md](screens/notifications.md)     | `/notifications`                   | `Notifications`, `NotificationsEmpty`, `MobileNotifications`                                        |
| Destinations             | [screens/destinations.md](screens/destinations.md)       | `/destinations`                    | `Destinations`                                                                                      |
| Simulate an event        | [screens/admin-simulate.md](screens/admin-simulate.md)   | `/admin/simulate`                  | `Simulate`                                                                                          |
| Not found                | [screens/not-found.md](screens/not-found.md)             | any unknown or forbidden path      | `NotFound`                                                                                          |
| Emails                   | [screens/emails.md](screens/emails.md)                   | sent by the email channel          | `Emails`                                                                                            |

## Decisions made during review

- The user approved the design system and all 23 artboards as first shown, with no changes (decision log, 2026-11-27).
- The agent removed one thing before showing it: a "Sign up again" button on the expired-link screen, because it relied on unverified provider behaviour and the acceptance criteria ask only for a link to sign in.
- After the approval, the agent rendered the exported HTML in a browser and found two stylesheet faults, neither a change to the design:
  - Link-styled buttons took the link colour, so "Delete alert" was petrol on red and the "Delete" links were not red. Fixed with three colour rules.
  - `tabular-nums` widened commas, full stops and colons in this typeface ("13 : 42 UTC"). Removed, and the rule is now in [tokens.md](tokens.md).

  The screenshots in [screens/](screens/) were taken after both fixes, and both artifacts carry the fixed stylesheet.

- The canvas artifact itself was not checked as rendered by the agent: its type forbids that unless asked. The `ux-reviewer` checks the built application against these files in the Review phase.

## For the Contracts ticket

Applying the design is part of the increment's Contracts ticket, not of any implementation ticket:

- Replace the colour values in `src/app/globals.css` with the block in [tokens.md](tokens.md), set `--radius: 0.375rem`, and add `--color-*` entries in `@theme inline` for the tokens shadcn does not define: `destructive-foreground`, `destructive-muted`, the five `severity-*`, `success`, `success-muted`, `warning`, `warning-muted`.
- Replace Geist with Schibsted Grotesk through `next/font/google` in the root layout, exposed as `--font-sans`. The family is in the bundled font data of the installed Next.js (checked 2026-11-27).
- Decide how the dark theme follows the system setting, and apply it once.
- Add the shadcn/ui primitives and create the shared components listed at the top of [components.md](components.md).
- Set the metadata title to "Heads-up".
- Provide one shared way to show a success Notice after a redirect. Four notices cross a redirect: "Email confirmed.", "Alert created.", "Changes saved." and "Alert deleted.". Parallel tickets must not each invent their own.
