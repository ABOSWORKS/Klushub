# Phase 1 QA Checklist

Use this as the default regression pass for Codex changes.

## Customer Posting

- Submit hero form with valid input.
  Expected: no console error, success path appears, user is not stuck in loading state.
- Submit full form with all required fields.
  Expected: job is created or a clear error is shown; publish button resets correctly.
- Submit with missing required fields.
  Expected: validation blocks submission and no broken state remains.

## Confirmation Modal

- Open the confirmation modal after successful posting.
  Expected: modal is visible, page scroll is locked, CTA buttons are clickable.
- Close via close button, backdrop, and Escape.
  Expected: modal closes cleanly and page scroll is restored.
- Reopen by posting again.
  Expected: modal state is still correct on the second open.

## Beheer / Manage Flow

- Open beheer directly from the confirmation modal.
  Expected: klant beheer panel loads the correct job.
- Open beheer from URL params `?beheer=...&token=...`.
  Expected: panel opens and the token is stored locally for later reuse.
- Open saved local job from the placed-jobs list.
  Expected: the same beheer flow remains reachable.

## Contractor Critical Action

- Log in as contractor and submit an offer on a job.
  Expected: modal opens, validation works, offer can be sent without console errors.
- Register a new contractor and repeat the offer flow.
  Expected: no broken profile dependency blocks the first offer.

## Mobile Smoke

- Test main journeys at a small viewport.
  Expected: posting form, confirmation modal, auth overlay, and review modal remain usable.
- Check buttons near overlays and bottom sections.
  Expected: no clipped CTA, no locked unusable scroll, no overlapping text.
