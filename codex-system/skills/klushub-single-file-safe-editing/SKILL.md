---
name: klushub-single-file-safe-editing
description: Use when editing Klushub's large single-file app so changes stay local, reversible, and safe for parallel agent work in index.html.
---

# Klushub Single File Safe Editing

Use this skill before changing `index.html`.

## Guardrails

- Work in the Codex workspace only.
- Never edit the backup file.
- Keep one writing owner per code area.
- Avoid broad search-and-replace across unrelated sections.
- If a helper extraction is useful, extract only the smallest stable unit.

## Editing Pattern

1. Find the exact section that owns the behavior.
2. Map nearby dependencies:
   CSS class names, element ids, inline handlers, helper functions, local storage keys, Supabase calls.
3. Change the smallest block that resolves the issue.
4. Check for duplicated markup or mirrored handlers elsewhere in the file.
5. Add a short regression note covering the surrounding journey.

## Safe Refactor Targets

- Constants and config values
- Modal helper functions
- Form submission helpers
- Supabase helper wrappers
- Repeated status or toast handling

## Avoid By Default

- Large-scale structure changes
- Multi-flow rewrites in one change
- Styling overhauls bundled with logic fixes
- Mixing bug fixes and feature additions unless tightly coupled
