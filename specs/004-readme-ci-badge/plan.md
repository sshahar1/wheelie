# Implementation Plan: README CI Status Badge

**Branch**: `004-readme-ci-badge` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-readme-ci-badge/spec.md`

## Summary

Add a GitHub Actions-hosted CI status badge near the top of `README.md`, targeting the `ci.yml`
workflow on the `main` branch, linking through to the workflow's run history. Documentation-only
change — no CI workflow behavior is modified.

## Technical Context

**Language/Version**: N/A — Markdown documentation change only
**Primary Dependencies**: GitHub's native Actions workflow status badge endpoint
(`https://github.com/sshahar1/wheelie/actions/workflows/ci.yml/badge.svg?branch=main`), no new
dependency introduced
**Storage**: N/A
**Testing**: No automated test applies — see Constitution Check (Testing Standards) below;
validated manually via `quickstart.md`
**Target Platform**: GitHub-rendered README (web)
**Project Type**: Single project — documentation change only, no source code touched
**Performance Goals**: N/A — static markdown/image reference, no runtime code path
**Constraints**: Must not alter `ci.yml` triggers/behavior; badge must target the `main` branch;
badge must degrade gracefully (GitHub's default "no status" rendering) if no runs exist yet
**Scale/Scope**: One badge line/section added to `README.md`; no other files change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Result |
|---|---|---|
| I. Code Quality | Single-line Markdown addition, reviewed via normal PR review; no linting/static-analysis surface applies to README prose. | PASS |
| II. Testing Standards (NON-NEGOTIABLE) | This principle governs *functionality* and *bug fixes* with executable behavior. A static badge reference has no logic to unit-test — GitHub itself owns rendering the badge's live state. Verification instead happens via manual check in `quickstart.md` (badge renders, links to the correct workflow page). Documented here as not applicable rather than an exception, since no functional behavior is being shipped. | PASS (N/A, documented) |
| III. UX Consistency | Badge follows the standard OSS convention (placed directly under the title, linking to CI history) already familiar to GitHub users — reuses an existing, widely recognized pattern rather than inventing one. | PASS |
| IV. Performance Requirements | No runtime code path; a static Markdown image reference has no performance budget to define. | PASS |

No violations — Complexity Tracking table below is empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-readme-ci-badge/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (documents: no new entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

No `contracts/` directory — this feature exposes no API/interface; it is a documentation-only
change to `README.md`.

### Source Code (repository root)

```text
README.md   # single edit: insert badge markdown near the top
```

**Structure Decision**: Single project (existing NestJS app layout, unchanged). The only file
touched is `README.md` at the repository root — no `src/`, `tests/`, or CI configuration changes.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 0 | 0 | No application logic involved |
| Data Operations | 0 | 0 | No schema/entity changes |
| UI Components | 0 | 0 | N/A — no application UI, only README presentation |
| Integrations | 0 | 0 | Reuses GitHub's existing badge endpoint; no new integration code |
| Infrastructure | 0 | 1 | Single mechanical Markdown edit to `README.md` |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- None — there is no logic or external contract to get subtly wrong.

**Agent-Delegated [ASYNC] Classifications:**

- Insert the CI badge Markdown into `README.md` — fully mechanical, well-specified, low risk;
  correctness is directly visible by viewing the rendered README.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Add CI badge markdown to `README.md` | [ASYNC] | Mechanical documentation edit | Low | Static text insertion, verified by visual/manual check in `quickstart.md` |

## Complexity Tracking

*No violations — Constitution Check passed cleanly above. Table intentionally left empty.*
