# Session Context

Last updated: 2026-03-25

## Purpose

This file preserves the key context of the Codex workstream for Klushub so a new Codex session can recover quickly without relying on chat history alone.

## Workspace And Branch Rules

- Codex writes only in `D:\Backup bestanden\Aron\Coding\Klushub\21 maart backto 1 HTML file\Codex\klushub-codex-workspace`
- Codex pushes only to branch `codex/klushub-platform`
- Claude work must not be modified or sabotaged
- Backup file must remain untouched:
  `index.codex-backup-2026-03-25-1459.html`

## Current Codex System

- Agent playbook exists in `codex-system/AGENT_SETUP.md`
- Agent prompt templates exist in `codex-system/TASK_TEMPLATES.md`
- Phase 1 custom skills exist in `codex-system/skills/`
- Installed external skill mapping exists in `codex-system/INSTALLED_SKILLS_MAP.md`
- Phase 1 backlog exists in `codex-system/PHASE1_BUG_BACKLOG.md`
- Phase 1 QA checklist exists in `codex-system/PHASE1_QA_CHECKLIST.md`

## Installed Skills

Installed in `C:\Users\aronb\.codex\skills`:

- `frontend-skill`
- `playwright-interactive`
- `security-threat-model`
- `security-best-practices`
- `gh-fix-ci`

Primary usage:

- Lead Architect: `security-threat-model`, `security-best-practices`, `gh-fix-ci`
- Implementation Engineer: `frontend-skill`, `security-best-practices`
- QA/Test Agent: `playwright-interactive`, `security-best-practices`
- UI/UX Designer: `frontend-skill`, `ui-ux-pro-max`

## Changes Already Implemented

Committed on Codex branch:

- Added Codex agent system files and skill definitions
- Added installed skill mapping
- Hardened `index.html` in several phase 1 stability areas:
  - removed unsafe klus publish success fallback when no safe beheer data is available
  - made contractor offer list resilient to missing related `klussen` data
  - fixed review star highlighting logic
  - made `openKlantBeheer()` return success/failure so URL cleanup can wait
  - delayed `history.replaceState()` until beheer flow opens successfully
  - improved registration flow so auth success without profile insert no longer shows false success

## Git Status

- Codex branch exists remotely: `codex/klushub-platform`
- Relevant pushed commits from this session:
  - `6bc02b1` Add Codex agent system and stabilize core flows
  - `fcac486` Document installed Codex skill assignments

## Latest Troubleshooting Round

- Investigated and fixed broken FAQ and aannemer navigation/state issues
- Aannemer route now loads data when opened
- Duplicate FAQ aannemer stappenplan section removed
- FAQ aannemer deep-link now points to the correct tab
- Aannemer profiel popup now guards against invalid ids
- Mobile navigation now keeps core links reachable under 640px
- Confirmation modal close/open state hardened
- Stored placed-job entries are now sanitized, deduplicated, and capped
- Magic-link and publish success flow now share the same safer local storage helper
- Aannemer accept flow now checks both backend steps before success UI
- Main customer overlays now use counted scroll-lock helpers in the core stacked flows
- Saved beheer links now have a cleanup path when a stored entry is no longer valid

## Active Priorities

1. Stabilize core customer flow
2. Stabilize confirmation modal behavior
3. Verify and harden beheer/manage flow
4. Verify contractor submit flow for newly registered users
5. Use Playwright-driven QA on key journeys

## Known Constraints

- We are working from a large single-file app in `index.html`
- Safer to do gradual extraction rather than a large refactor
- This VS Code chat does not support ChatGPT Projects in the same way as web
- Session continuity therefore depends on repo files like this one

## Update Policy

- Update this file after meaningful decisions, new installed skills, important fixes, branch/workflow changes, or new priorities
- Do not rewrite the whole file for tiny conversational turns
- Keep it concise and practical so future sessions can read it fast



- Fixed FAQ white screen on 2026-03-25 by restoring a missing closing </div> for mijnKlussenOverlay; this moved #page-faq back to a normal body-level page instead of being nested inside the overlay
- Updated local Codex config on 2026-03-25 to trust the Codex workspace, use workspace-write sandboxing with that workspace as writable root, enable web search, and reduce approvals to on-failure; also added allow-rules for common git actions in the Codex workspace (`status`, `add`, `commit`, `diff`, `rev-parse`, `log`, `push`)
