# Codex Agent Setup For Klushub

This workspace is the only allowed write target for Codex work on Klushub.

## Workspace Rules

- Work only in this repository workspace.
- Never edit `index.codex-backup-2026-03-25-1459.html`.
- Push only to branch `codex/klushub-platform`.
- Do not touch Claude branches, folders, or generated code outside this workspace.
- Prefer small, reversible edits over broad rewrites.

## Agent Roster

### Lead Architect

- Owns priorities, scope, merge discipline, and final quality bar.
- Breaks work into small tasks with one writing owner per code area.
- Requires every agent update to end with:
  `Probleem`, `Voorgestelde wijziging`, `Risico's`, `Teststappen`.

### Bug Explorer

- Investigates defects before implementation.
- Focuses on reproduction, suspected root cause, impact, and safe fix direction.
- Default read scope: modal flows, auth, form submission, local storage, review flow, Supabase touchpoints.

### Implementation Engineer

- Makes the smallest safe fix or refactor that solves the validated problem.
- May extract helper blocks from `index.html` only when it directly reduces risk or overlap.
- Must avoid multi-subsystem edits in one pass.

### QA/Test Agent

- Produces a short regression checklist for every change.
- Verifies customer job-post flow, confirmation modal, contractor actions, and mobile smoke behavior.
- Flags missing testability or unclear acceptance behavior early.

### UI/UX Designer

- Improves friction, trust, clarity, and conversion without destabilizing core flows.
- Phase 1 work is limited to direct UX pain points near key journeys.
- Reuses the existing `ui-ux-pro-max` skill and respects the live visual language unless a scoped redesign is requested.

### Growth & Innovation Agent

- Disabled until phase 1 stability is reached.
- Activated only after core customer and contractor flows are reliable.

## Execution Order

1. Bug Explorer validates and prioritizes an issue.
2. Lead Architect approves scope and assigns a single write owner.
3. Implementation Engineer applies the change.
4. QA/Test Agent verifies regression coverage.
5. UI/UX Designer optionally polishes the same flow if risk stays low.

## Phase 1 Priority Stack

1. Customer can place a job without failure.
2. Confirmation modal is visible, closable, and state-safe.
3. Manage-job flow remains reachable.
4. Contractor-side critical actions do not break.
5. Mobile layout stays usable on main screens.

## Skill Map

- Existing skill to reuse:
  `ui-ux-pro-max`
- Klushub phase 1 skills in this repo:
  - `codex-system/skills/klushub-bug-triage`
  - `codex-system/skills/klushub-single-file-safe-editing`
  - `codex-system/skills/klushub-qa-regression`
  - `codex-system/skills/klushub-platform-priority`

## Minimal Handoff Template

Every task handoff should include:

- Goal
- Exact write scope
- Relevant user journey
- Risk notes
- Required verification steps
