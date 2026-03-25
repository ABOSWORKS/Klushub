---
name: klushub-qa-regression
description: Use when validating Klushub changes so each fix or refactor gets a short regression checklist covering customer, contractor, modal, form, and mobile behavior.
---

# Klushub QA Regression

Use this skill after any planned change.

## Core Smoke Checks

1. Customer can start and complete the job-post flow.
2. Confirmation modal opens, is visible, and closes cleanly.
3. Manage-job or beheer flow remains reachable.
4. A key contractor action still works without console errors.
5. Main mobile screens remain usable.

## Regression Checklist Format

Return a short checklist with:

- Journey tested
- Expected result
- High-risk edge case

## Focus Areas

- Modal visibility and scroll lock
- Form validation and disabled/loading states
- Navigation between landing, job, FAQ, auth, and review views
- Local storage continuity on the same device
- Defensive handling when Supabase data is missing or slow

## Reporting

End with:
`Probleem`, `Voorgestelde wijziging`, `Risico's`, `Teststappen`
