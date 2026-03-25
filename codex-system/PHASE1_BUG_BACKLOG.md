# Phase 1 Bug Backlog

This list is intentionally short. It is the first Codex stability queue.

## P1

### 1. Customer manage flow depends on backend behavior that may not match UI promises

- `insertKlus()` stores the beheer token client-side and immediately opens the confirmation flow.
- `openKlantBeheer()` depends on RPC `get_klus_beheer`.
- If the RPC, token persistence, or insert behavior diverges, the user sees a working confirmation path but cannot manage the job.

### 2. Confirmation modal mixes CSS state and inline style state

- `showKlusBevestiging()` forces `display`, `visibility`, and `opacity` inline.
- `closeBevestiging()` removes the class but leaves `display:flex` in place.
- This is fragile for reopen behavior, accessibility state, and later modal refactors.

### 3. Review flow is presented as automatic platform behavior but appears only locally triggered

- Marketing and FAQ copy claim review invites and email follow-ups.
- The current code exposes `openReviewModal()` and `submitReview()` but no obvious automated trigger from a completed project lifecycle.
- This creates a likely product gap between promised and implemented behavior.

## P2

### 4. Contractor flow can fail hard if auth/profile state is incomplete

- `submitAanbieding()` writes directly with `currentUser.id`.
- Login and registration flows exist, but the contractor journey still depends on current profile state and working Supabase tables.
- This needs explicit QA around just-registered users and partial profiles.

### 5. Location-dependent flows rely on third-party geocoding without a robust fallback path

- Filtering and edit flows call Nominatim.
- Slow or failed geocoding affects search relevance, edit behavior, and perceived correctness.
- This is not the first fix target, but it is a real stability risk.

## First Implementation Order

1. Harden confirmation modal state handling.
2. Verify and stabilize klant beheer access from confirmation flow and URL token flow.
3. Verify contractor submit flow for logged-in and newly registered users.
4. Clarify or defer review automation claims until the actual trigger path exists.
