---
name: autonomy-protocol-ops
description: "Enforce autonomous sprint execution for Klushub with strict protocol compliance. Use when working on Klushub tasks that require: (1) reading and acknowledging AUTONOMY_PROTOCOL.md, (2) test-first bug fixing (TDD), (3) semantic HTML discipline, (4) robust error handling, and (5) session journaling in LESSONS_LEARNED.md."
---

# Autonomy Protocol Ops

## Mandatory start sequence
1. Read `AUTONOMY_PROTOCOL.md` from the active workspace root before any implementation.
2. Respond exactly with `Protocol Accepted`.
3. State one immediate next step in one sentence.

If `AUTONOMY_PROTOCOL.md` is missing:
- Search nearby Klushub workspaces for the file.
- Continue with the same protocol behavior and log the fallback used.

## Test-first rule (no blind coding)
1. Reproduce the bug with a test before touching production code.
2. Prefer Playwright smoke/e2e for user-facing flows.
3. Require red->green flow:
- Red: test fails before fix.
- Green: test passes after fix.

## Implementation guardrails
1. Keep page flows isolated:
- Do not let one page’s loading state block another page’s load path.
- Prevent shared in-flight locks from causing cross-page stalls.
2. Use bounded async behavior:
- Add clear timeouts.
- Add safe recovery paths.
- Reset lock/state flags in `finally`.
3. Add defensive checks:
- Validate DOM element access.
- Validate API/query responses.
- Log errors with actionable context.

## Semantic HTML rule
1. Prefer semantic structure (`nav`, `main`, `section`, `article`, `aside`, `footer`) over generic wrappers where relevant.
2. Keep one primary `h1` per page state.
3. Preserve accessibility attributes when editing interactive regions.

## Memory management rule
1. Maintain `LESSONS_LEARNED.md` in workspace root.
2. Before ending the turn, append:
- Problem solved
- Why this solution was chosen
- Next logical AI action

## Done criteria
1. Repro test exists and passes.
2. Existing smoke suite remains green.
3. `LESSONS_LEARNED.md` updated.
4. Report includes:
- Root cause
- Patch summary
- Risks
- Test evidence
