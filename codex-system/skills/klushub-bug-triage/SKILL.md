---
name: klushub-bug-triage
description: Use when investigating Klushub bugs in the Codex workspace, especially around the single-file app, form flows, modals, auth, localStorage, review flows, and Supabase-linked behaviors.
---

# Klushub Bug Triage

Use this skill to investigate before editing code.

## Workflow

1. Define the exact user journey that fails.
2. Reproduce using the smallest path possible.
3. Identify the nearest UI state, DOM hook, storage key, or Supabase call involved.
4. State the likely root cause in one or two sentences.
5. Estimate blast radius before proposing a fix.
6. End with:
   `Probleem`, `Voorgestelde wijziging`, `Risico's`, `Teststappen`.

## What To Inspect First

- Modal open and close state
- Inline event handlers in `index.html`
- Form validation and submit flow
- Local storage reads and writes
- Query param or beheer-link routing
- Supabase client usage and null-state handling

## Output Rules

- Prefer observed facts over guesses.
- If not reproducible, say what blocked reproduction.
- Keep fix proposals small and reversible.
- Call out whether the issue is UI-only, state-related, data-related, or integration-related.
