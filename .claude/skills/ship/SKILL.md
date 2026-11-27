---
name: ship
description: Ship phase. Merges one increment into main through its pull request, deploys it to production (Supabase cloud and Vercel), verifies the live deployment, and brings the reviewer-facing README and the AI workflow write-up up to date. Run each time an increment's branch is reviewed and green.
disable-model-invocation: true
---

# Ship

Reviewers get a live URL and a repo they can run in one command. Every increment ends here, so the live site, the README and the write-up always describe the same, submittable state. Nothing here is finished until it has been checked against the live deployment.

`main` changes only through pull requests (see **Branches** in `CLAUDE.md`). The increment reaches it through its own pull request; what only production can show comes after, through a small `ship-<n>` pull request.

**Every command that changes a cloud resource or `main` needs the user's explicit approval in this session, each time.** That covers `gh pr merge`, `supabase db push --remote`, seeding the cloud database, and `vercel deploy --prod`. Show what will change, then ask.

The cloud targets: Supabase project `lrnzhnrxjwfckwwmtajn` (organisation `ai-task`, eu-west-1) and Vercel project `sonrisa-task`.

## 1. Preconditions

- You are on the increment's branch, `increment-<n>`, and it is pushed.
- `pnpm verify:full` is green locally and CI is green on the branch.
- Every ticket under the increment is closed or closed by the pull request, and every review of the increment is in `docs/reviews/` with a disposition per finding.

Stop and report if any of these fails.

## 2. README and write-up, on the increment branch

**README.** On the first increment, rewrite `README.md` for a reviewer who has ten minutes. On later ones, update the parts the increment changed:

1. What the application does, in two sentences, with the live URL and demo credentials at the top
2. Run it locally: prerequisites, then `pnpm install`, `pnpm bootstrap`, `pnpm dev`
3. What was built, mapped to the task's requirements, what was deliberately left out, and which increments have not shipped yet
4. Architecture in a short paragraph and the folder map, with links to the ADRs
5. How to run the tests
6. Known limitations and what would come next
7. A link to `docs/ai-workflow.md`

**Write-up.** Add the increment's row to the increments table in `docs/ai-workflow.md`, linking its issue, review files and screenshots. Check that the decision log has the increment's decisions and rejections.

**Evidence.** Run `pnpm evidence:export` and read the new prompts in `docs/prompts/` for personal data the redaction missed.

Commit with `docs: ship increment <n>` and push.

## 3. Merge the increment

- Open the pull request if it does not exist: `gh pr create --base main --head increment-<n>`, the body written with `mattpocock-skills:pr`, closing the increment issue and its tickets.
- Wait for CI on the pull request to pass.
- With approval, merge it with a merge commit, so its milestone commits stay in the history: `gh pr merge <number> --merge`.
- `git switch main` and `git pull --ff-only`. Deploy from this checkout of `main`, nothing else.

## 4. Database

- The repo is linked to the cloud project (`supabase link`). With CLI 3.x, database commands target the **local** stack unless you pass `--remote`.
- Show the migrations the cloud project has not applied yet: `pnpm exec supabase db push --remote --dry-run`.
- With approval, run `pnpm exec supabase db push --remote`, then confirm with `pnpm exec supabase migration list --remote` that local and remote match.
- With approval, load the demo data reviewers need. Never run `db reset` with `--remote` or `--linked`.
- Run the Supabase advisors (MCP `get_advisors`, security and performance) and fix or explain every finding.

## 5. Application

- Confirm the Vercel project has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for production. They are inlined at build time, so a change needs a new build.
- With approval, deploy: `pnpm dlx vercel@latest deploy --prod --yes`. The folder is linked to the Vercel project `sonrisa-task` (production URL https://sonrisa-task.vercel.app). The GitHub repository is not connected to Vercel, so merging to `main` does not deploy by itself.

## 6. Verify production

- `GET <url>/api/health` returns 200 with `"status":"ok"`.
- `E2E_BASE_URL=<url> pnpm e2e` passes against the live site.
- Walk the increment's primary user story in the browser as the demo user, on desktop and mobile widths, then the primary story of each earlier increment once. Save the screenshots as `docs/screenshots/<n>-production-<desktop|mobile>.png`.

A failure that needs a code fix goes on a `fix/<topic>` branch with its own pull request, then deploy again. Do not commit the fix to `main`.

## 7. Production evidence

- `git switch -c ship-<n>` from the updated `main`.
- Commit the production screenshots, add the pull request link and the shipped date to the increment's row in `docs/ai-workflow.md`, and run `pnpm evidence:export` once more.
- Push, open the pull request, and with approval merge it with `gh pr merge <number> --merge`.

After the last increment, finish `docs/ai-workflow.md` on this branch: it stays one page, as the map to the evidence, not a replacement for it. Fill the phase table from the real issues, pull requests and commits and link them. A phase that did not happen is marked as skipped with the reason, not deleted. Then close the spec issue.

## 8. Report

Give the user the live URL, the repository URL, the pull requests merged, what was verified and how, and anything that is not done, including the increments still open under the spec.
