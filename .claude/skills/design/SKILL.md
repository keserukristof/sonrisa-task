---
name: design
description: Design phase. Turns one increment into approved screen designs as Claude Design artifacts, and on the first run builds the design system they share, then exports them into docs/design/ so implementers can build from files. Run once per increment, after its Refine phase and before /to-tickets.
argument-hint: "[increment issue number]"
---

# Design

The user sees and approves how an increment looks and flows **before** any of its feature code is written. Parallel implementers work in git worktrees and read files, not artifacts, so the phase ends with the approved design exported into the repo.

Write no application code in this phase.

## 1. Understand what has to be designed

Read the increment issue (`$ARGUMENTS`, or the increment from the conversation), the spec above it, `GLOSSARY.md` if it exists, `.claude/rules/ui.md`, and what earlier increments exported to `docs/design/`.

List every screen the increment's user stories need, new or changed. For each one note its purpose, the primary action, the data it shows, and the states it needs beyond success: loading, empty, error.

Show the list to the user and confirm it before designing.

## 2. Choose the look and feel

Steps 2 and 3 belong to the first increment. Once `docs/design/tokens.md` exists the look is settled: go to step 4, and return to step 3 only to add a token or component a new screen needs.

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

On the first increment, create a Claude **Design** artifact that builds on that design system. On later increments, add the new artboards to it:

- One artboard per screen from step 1
- The primary flow at both mobile (360px) and desktop width
- Loading, empty and error states for the main data views
- Real copy from the spec and the glossary, not placeholder text

## 5. Review with the user

Share both artifacts. Walk through the primary flow in one or two sentences per screen. Revise until the user approves. Their approval ends this step, not yours.

Every direction the user rejects and every change they ask for goes into `docs/process/decision-log.md` as it happens, with the reason they gave.

## 6. Export into the repo

Write the approved design to `docs/design/`, adding to what earlier increments exported:

- `README.md`: links to both artifacts, the chosen direction and why, and decisions made during review
- `tokens.md`: every token with its light and dark value, the type scale, spacing and radius
- `screens/<screen-name>.md`, one per screen: purpose, layout structure from top to bottom, the components used, each state, the exact copy, and responsive behaviour
- Screenshots or exported HTML of the artboards next to those files, when the artifact can export them

A screen file is complete when an implementer who cannot open the artifact could still build the screen from it.

## 7. Hand off

- Applying new tokens to `src/app/globals.css` and the fonts to the root layout is part of the increment's **Contracts** ticket. Say so when `/to-tickets` runs.
- Add a line to `docs/ai-workflow.md` for this phase.
- Commit `docs/design/` with `docs(design): increment <n> screens`, or `docs(design): design system and increment 1 screens` on the first run.
