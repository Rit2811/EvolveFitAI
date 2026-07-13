# Start Here - Codex Execution Guide

## How to use this pack
Place this folder at the root of the EvolveFit AI repository. Codex should read `AGENTS.md` automatically as repository guidance.

Do not ask Codex to build the whole product in one uncontrolled pass. Complete the task files in order so each phase remains testable and reversible.

## First prompt to give Codex

```text
Read AGENTS.md and all files under docs/. Inspect the current repository before changing anything.

Then:
1. Summarize the current state of the frontend, backend, dependencies, environment setup, and existing routes.
2. Identify the first incomplete task in /tasks.
3. Implement only that task completely.
4. Keep the app runnable.
5. Run the relevant build/lint/test commands.
6. Fix any errors caused by your changes.
7. Report files changed, commands run, what now works, unresolved issues, and the next task.

Do not overengineer or add technologies outside AGENTS.md.
```

## Prompt for every following phase

```text
Read AGENTS.md and the next incomplete file in /tasks. Inspect the current code and reuse existing patterns. Implement that task end to end, run relevant checks, fix regressions, and stop after its acceptance criteria pass. Report the result and recommend the next task.
```

## Emergency deadline prompt
Use this when less than 90 minutes remain:

```text
We are approaching the submission deadline. Read AGENTS.md and docs/DEMO_CHECKLIST.md. Audit the current application against P0 only. Fix the highest-impact blocker preventing the main demo flow. Do not add new features. Prefer fallback data, hidden unfinished controls, and reliable demo behavior. Run a production build and report the exact remaining demo risks.
```

## Final QA prompt

```text
Act as a release engineer. Do not redesign or add features. Verify the full demo flow from registration through plan adaptation. Run all available checks, inspect frontend routes and backend responses, find broken imports, console errors, empty states, exposed secrets, and nonfunctional controls. Fix only release-blocking issues and update the README with setup and demo instructions.
```
