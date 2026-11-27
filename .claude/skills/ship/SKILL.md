---
name: ship
description: Ship phase. Deploys one increment to production (Supabase cloud and Vercel), verifies the live deployment, and brings the reviewer-facing README and the AI workflow write-up up to date. Run each time an increment is merged and green.
disable-model-invocation: true
---

# Ship

Reviewers get a live URL and a repo they can run in one command. Every increment ends here, so the live site, the README and the write-up always describe the same, submittable state. Nothing here is finished until it has been checked against the live deployment.

**Every command that changes a cloud resource needs the user's explicit approval in this session, each time.** That covers `supabase db push --remote`, seeding the cloud database, and `vercel deploy --prod`. Show what will change, then ask.

The cloud targets: Supabase project `lrnzhnrxjwfckwwmtajn` (organisation `ai-task`, eu-west-1) and Vercel project `sonrisa-task`.

## 1. Preconditions

- The increment's integration branch is merged to `main` and `main` is pushed.
- `pnpm verify:full` is green locally and CI is green on `main`.
- No open ticket under the increment being shipped.

Stop and report if any of these fails.

## 2. Database

- The repo is linked to the cloud project (`supabase link`). With CLI 3.x, database commands target the **local** stack unless you pass `--remote`.
- Show the migrations the cloud project has not applied yet: `pnpm exec supabase db push --remote --dry-run`.
- With approval, run `pnpm exec supabase db push --remote`, then confirm with `pnpm exec supabase migration list --remote` that local and remote match.
- With approval, load the demo data reviewers need. Never run `db reset` with `--remote` or `--linked`.
- Run the Supabase advisors (MCP `get_advisors`, security and performance) and fix or explain every finding.

## 3. Application

- Confirm the Vercel project has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production. They are inlined at build time, so a change needs a new build.
- With approval, deploy: `pnpm dlx vercel@latest deploy --prod --yes`. The folder is linked to the Vercel project `sonrisa-task` (production URL https://sonrisa-task.vercel.app). The GitHub repository is not connected to Vercel, so pushing to `main` does not deploy by itself.

## 4. Verify production

- `GET <url>/api/health` returns 200 with `"status":"ok"`.
- `E2E_BASE_URL=<url> pnpm e2e` passes against the live site.
- Walk the increment's primary user story in the browser as the demo user, on desktop and mobile widths, then the primary story of each earlier increment once.

Fix what fails and redeploy before continuing.

## 5. README

On the first increment, rewrite `README.md` for a reviewer who has ten minutes. On later ones, update the parts the increment changed:

1. What the application does, in two sentences, with the live URL and demo credentials at the top
2. Run it locally: prerequisites, then `pnpm install`, `pnpm bootstrap`, `pnpm dev`
3. What was built, mapped to the task's requirements, what was deliberately left out, and which increments have not shipped yet
4. Architecture in a short paragraph and the folder map, with links to the ADRs
5. How to run the tests
6. Known limitations and what would come next
7. A link to `docs/ai-workflow.md`

## 6. AI workflow write-up

Add the increment's row to the increments table in `docs/ai-workflow.md`, linking its issue and pull request.

After the last increment, finish the page. Keep it to one compact page of what was **actually used** in this project: fill the phase table from the real issues, pull requests and commits, link them, and delete any row that did not happen. Then close the spec issue.

## 7. Report

Give the user the live URL, the repository URL, what was verified and how, and anything that is not done, including the increments still open under the spec.
