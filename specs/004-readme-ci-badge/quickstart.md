# Quickstart: Validate the README CI Status Badge

## Prerequisites

- The change has been committed/pushed to a branch visible on GitHub (badges render from GitHub's
  hosted endpoint, not from a local Markdown preview).
- The existing `ci.yml` workflow (see `research.md` Decision) has run at least once on `main`.

## Validation steps

1. **Render check** — open `README.md` on GitHub (or a Markdown preview that fetches remote
   images) and confirm a badge image appears near the top, under the title.
2. **State check** — compare the badge's displayed color/label ("passing"/"failing"/"no status")
   against the actual latest run shown at:
   `https://github.com/sshahar1/wheelie/actions/workflows/ci.yml` (filtered to `main`).
   - Expected: they match. This validates FR-001 and FR-002, and SC-002.
3. **Link-through check** — click the badge image.
   - Expected: navigates to `https://github.com/sshahar1/wheelie/actions/workflows/ci.yml`.
     This validates FR-004 and SC-003.
4. **Placement check** — confirm the badge is visible without scrolling when the README first
   loads. This validates FR-003 and SC-001.
5. **No-CI-change check** — confirm `.github/workflows/ci.yml` has no diff as part of this
   change (`git diff` should only touch `README.md`). This validates FR-005.

## Expected outcome

All five checks pass with no manual/static workaround — the badge is live and self-updating.
