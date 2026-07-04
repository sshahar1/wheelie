# Research: README CI Status Badge

No `NEEDS CLARIFICATION` items remained in the Technical Context, so this phase documents the
one real decision: which badge mechanism to use.

## Decision: Badge source and format

**Decision**: Use GitHub's native Actions workflow-status badge —
`https://github.com/sshahar1/wheelie/actions/workflows/ci.yml/badge.svg?branch=main` — wrapped in
a Markdown link back to `https://github.com/sshahar1/wheelie/actions/workflows/ci.yml`.

**Rationale**:
- Zero configuration and no third-party account/token needed — GitHub generates and serves the
  badge directly from the workflow that already exists (`ci.yml`).
- Always in sync with the actual latest run automatically (satisfies FR-002); no separate service
  to fall out of date with the repo.
- Matches the constraint that no CI behavior may change — this is purely an additive, read-only
  reference to the existing workflow.

**Alternatives considered**:
- **shields.io wrapping GitHub Actions**: Offers more style/format customization (flat, plastic,
  color overrides), but adds a third-party dependency and an extra network hop for something the
  constraints don't ask for (no styling requirement in the spec). Rejected as unnecessary
  complexity for a P1 "show pass/fail" requirement.
- **Third-party CI badge (e.g., if a separate CI vendor were used)**: Not applicable — this repo's
  CI is GitHub Actions (`ci.yml`), so there is no other CI system to point a badge at.
