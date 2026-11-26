# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root.
- **`docs/adr/`**: read ADRs that touch the area you are about to work in.
- **`docs/design/`**: the approved design system and screens, once the design phase has run.

If any of these do not exist, **proceed silently**. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill (reached through `/grill-with-docs`) creates the glossary and ADRs lazily, when terms or decisions actually get resolved.

## File structure

This is a single-context repo:

```
/
├── GLOSSARY.md
├── docs/adr/
│   └── 0001-architecture-baseline.md
├── docs/design/
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a table or column name, a component name, a test name), use the term as defined in `GLOSSARY.md`. Do not drift to synonyms the glossary explicitly avoids.

If the concept you need is not in the glossary yet, that is a signal: either you are inventing language the project does not use (reconsider), or there is a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding it:

> _Contradicts ADR-0001 (per-user reads are uncached), but worth reopening because…_
