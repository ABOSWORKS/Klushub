# Troubleshooting Overview

Last updated: 2026-03-25

## Goal

Create a more stable baseline for Klushub by finding and fixing navigation and page-state bugs in the Codex workspace.

## This Round

### User-reported issues investigated

- FAQ page does not work correctly
- Aannemer page does not work correctly

### Agent findings

Bug Explorer confirmed:

- `showPage()` did not trigger `loadAannemers()`
- FAQ had duplicate `faq-aannemer-stappenplan` ids
- FAQ deep link for aannemer stappenplan targeted the wrong tab index
- `openAannemerProfiel()` could open a blank overlay for invalid ids

QA focus confirmed:

- FAQ tab routing needed cleanup
- Aannemer page needed real loading on route open
- Mobile navigation needed a reachable path to FAQ and aannemers under 640px

## Fixes Applied In Codex Workspace

- `showPage('aannemers')` now triggers `loadAannemers()`
- `showPage()` now handles missing page ids more safely
- duplicate `faq-aannemer-stappenplan` section removed
- FAQ link in aannemer FAQ now points to the correct tab index for aannemer stappenplan
- `openAannemerProfiel()` now validates the aannemer before opening the overlay
- quick city chips on aannemer filters now pass `this` explicitly instead of relying on global `event`
- mobile nav under 640px now keeps primary nav links reachable instead of hiding them entirely

## Remaining Follow-up

- run interactive QA on FAQ tab switching and aannemer filters/cards
- verify mobile nav layout still looks acceptable on small screens
- review confirmation modal state handling next
- continue phase 1 bug backlog in `codex-system/PHASE1_BUG_BACKLOG.md`

## Modal And Beheer Hardening

Additional fixes in this round:

- added `readGeplaatsteKlussen()` to sanitize stored job entries
- added `rememberGeplaatsteKlus()` to deduplicate and cap stored jobs
- updated job publish success flow to reuse the safe storage helper
- updated magic-link beheer success flow to reuse the safe storage helper
- made confirmation modal close restore `display:none` after close transition
- reset confirmation overlay scroll position on open
- improved placed-jobs list rendering so missing descriptions do not render as broken `...`

## Transaction And Overlay Follow-up

Additional fixes in this round:

- `beheerKiesAannemer()` now checks both RPC steps before showing success and opening the review flow
- added overlay scroll-lock helpers for stacked overlays in the main customer flows
- applied overlay lock tracking to review modal, bevestiging modal, klant beheer, geplaatste klussen, and mijn aanbiedingen
- added `openSavedKlusFromList()` with cleanup path for stale saved beheer links
- added `removeGeplaatsteKlus()` for explicit local cleanup
- confirmation modal direct beheer CTA now preserves the just-created beheer context during close

## FAQ White Screen Root Cause

- The FAQ white screen was caused by a missing closing </div> in the mijnKlussenOverlay markup
- Because that overlay container was left open, #page-faq and the sections after it were parsed inside the overlay instead of as normal body-level pages
- Added the missing closing tag so #page-faq is once again a direct body child and the FAQ page can render as a normal page


## Profile + Regio + Postcode Round

Additional fixes in this round:

- fixed Profiel bewerken not opening by removing recursive override behavior (openEditProfile now safely calls openEditProfileBase)
- hardened aannemer loading by splitting aannemers and reviews fetches, then aggregating reviews client-side
- fixed aannemer regio filtering fallback by restoring city-coordinate lookup via getStadCoords(...)
- cleared stale aannemer regio state when geocoding fails (reset lat/lng, hide radius UI, re-apply filters)
- improved klus regio filtering to also use city-coordinate fallback when klus coordinates are missing
- added postcode normalization (5705Cl -> 5705 CL) and postcode->stad autofill flow for the full klus form

## Playwright QA Setup

- added Playwright project setup files (`package.json`, `playwright.config.js`) and ignore rules for test artifacts
- added deterministic smoke tests for profile edit, aannemer regio filter behavior, klus regio filter behavior, and postcode->stad autofill
- installed `@playwright/test` plus Chromium browser binary
- validated smoke path with `npm run test:smoke` => `SMOKE_OK`
