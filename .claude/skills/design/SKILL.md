---
name: design
description: Design phase. Turns the spec into an approved design system and screen designs as Claude Design artifacts, then exports them into docs/design/ so implementers can build from files. Run after /to-spec and before /to-tickets or /contracts.
argument-hint: "[spec issue number or path]"
---

# Design

The user sees and approves how the application looks and flows **before** any feature code is written. Parallel implementers work in git worktrees and read files, not artifacts, so the phase ends with the approved design exported into the repo.

Write no application code in this phase.

## 1. Understand what has to be designed

Read the spec (`$ARGUMENTS`, or the spec issue from the conversation), `GLOSSARY.md` if it exists, and `.claude/rules/ui.md`.

List every screen the Must and Should user stories need. For each one note its purpose, the primary action, the data it shows, and the states it needs beyond success: loading, empty, error.

Show the list to the user and confirm it before designing.

## 2. Choose the look and feel

Call the Skill tool with `frontend-design:frontend-design` for aesthetic direction.

Propose two or three directions in words. For each: the mood in one sentence, the palette, the typeface pairing, density, and corner and shadow character. Tie each to the product's audience. Recommend one and ask the user to choose. Do not start building until they have.

## 3. Build the design system

Create a Claude **Design System** artifact with the Artifact tool. Call its quickstart first and follow the instructions the type returns.

Include only what the screens need:

- Colour tokens for light and dark themes, named to match the shadcn variables in `src/app/globals.css` (`background`, `foreground`, `primary`, `muted`, `destructive`, `border`, `ring`, and so on)
- Type scale and font families
- Spacing and radius scales
- The core components the screens use, with their states

Check text and UI contrast against WCAG 2.2 AA before showing it.

## 4. Design the screens

Create a Claude **Design** artifact that builds on that design system:

- One artboard per screen from step 1
- The primary flow at both mobile (360px) and desktop width
- Loading, empty and error states for the main data views
- Real copy from the spec and the glossary, not placeholder text

## 5. Review with the user

Share both artifacts. Walk through the primary flow in one or two sentences per screen. Revise until the user approves. Their approval ends this step, not yours.

## 6. Export into the repo

Write the approved design to `docs/design/`:

- `README.md`: links to both artifacts, the chosen direction and why, and decisions made during review
- `tokens.md`: every token with its light and dark value, the type scale, spacing and radius
- `screens/<screen-name>.md`, one per screen: purpose, layout structure from top to bottom, the components used, each state, the exact copy, and responsive behaviour
- Screenshots or exported HTML of the artboards next to those files, when the artifact can export them

A screen file is complete when an implementer who cannot open the artifact could still build the screen from it.

## 7. Hand off

- Applying the tokens to `src/app/globals.css` and the fonts to the root layout is part of the **Contracts** ticket. Say so when `/to-tickets` runs.
- Add a line to `docs/ai-workflow.md` for this phase.
- Commit `docs/design/` with `docs(design): approved design system and screens`.
