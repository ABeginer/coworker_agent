PLS-README.txt
==============

Purpose
-------
This file documents the protocol Hermes Agent follows when it changes files in
this repository and pushes them for review. Read it before asking for an edit so
the handoff is predictable.

1. How files get modified
-------------------------
- Read first, edit second: the whole target file is read before a patch, and
  edits are minimal diffs — no drive-by reformatting, no renames the task did
  not ask for.
- Respect the existing conventions: TypeScript interfaces as already declared
  (e.g. Task, TaskStatus), Tailwind v4 utility classes, App Router layout under
  src/app, and the src/ copies rather than the root shadow stubs.
- Untracked or generated paths (.env, .env.local, node_modules/, .next/,
  *.tsbuildinfo, .hermes-index.md) are never staged into a commit.

2. Pre-flight (before any edit)
-------------------------------
- Confirm the git working tree state and report anything dirty.
- Branch from the latest origin/main, never from another unmerged feature
  branch:  git fetch origin && git checkout -b hermes-edit/<short-slug> origin/main
- One request = one branch and one focused PR.

3. Validation (before every commit)
-----------------------------------
- Type check:  npx tsc --noEmit    (must report 0 errors)
- Lint:        npm run lint
  Status in this repo: NOT RUNNABLE yet — the script is "next lint" but ESLint
  and an eslint config are not installed, so it opens an interactive setup
  prompt. Until that is added, lint is reported as unavailable rather than
  claimed as passing.
- Failing code is never pushed. If a check cannot run, that is stated
  explicitly in the report instead of being silently skipped.
- Note: a stale .next/ left over from another branch makes tsc emit phantom
  "Cannot find module '../../../src/app/layout.js'" errors, because the
  generated .next/types files point at route files that branch does not have.
  Clear .next/ before trusting the result.

4. Commit and push
------------------
- Stage explicitly (git add <paths>) and confirm the staged list before commit.
- Commit message is Conventional Commits, matching the request intent:
    feat: <brief description>    (new capability)
    fix:  <brief description>    (defect repair)
    chore: <brief description>   (tooling/config only)
- Push with the credential helper that works in a non-tty shell:
    git -c credential.helper=manager push -u origin hermes-edit/<short-slug>

5. Pull request (automated)
---------------------------
- No gh CLI and no PAT are needed locally. .github/workflows/hermes-auto-pr.yml
  triggers on any push to hermes-edit/** and opens the PR against main with the
  latest commit subject as the title.
- Prerequisite, already configured on this repo: Settings > Actions > General
  must allow "GitHub Actions to create and approve pull requests"
  (can_approve_pull_request_reviews = true). Without it the job fails with
  "GitHub Actions is not permitted to create or approve pull requests".
- The PR link is verified through the API before it is reported back.

6. Next steps protocol
----------------------
a) Review the PR diff; every change is review-only until a human merges.
b) If the scope is wrong, comment on the PR or ask for a new branch — do not
   force-push over a reviewed branch.
c) On merge: main is the source of truth; local main is fast-forwarded and the
   hermes-edit/** branch is deleted.
d) Follow-ups (lint setup, RLS hardening, wiring TaskForm.onTaskCreated) each
   get their own hermes-edit/<slug> branch and their own PR.

Current known follow-ups in this repo
-------------------------------------
- ESLint + config so npm run lint actually runs.
- RLS: policies are USING(true) for anon on public.tasks (world-writable) and
  there is no DELETE policy.
- TaskForm.onTaskCreated is never wired in src/app/tasks/page.tsx.
- .env.local.example ships a live project URL and publishable key.

Author: Hermes Agent
