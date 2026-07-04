# Implementation Plan: Upgrade PostgreSQL to Version 18

**Branch**: `005-upgrade-postgres-18` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-upgrade-postgres-18/spec.md`

## Summary

Move the project's only version-pinned PostgreSQL reference — the ephemeral CI service container (`postgres:16-alpine` in `.github/workflows/ci.yml`) — to PostgreSQL 18, update developer-facing docs that name a version, and verify the existing Prisma 5.22.x tooling and migration history are compatible with PostgreSQL 18 before merging. No production/staging database exists in-repo, so this is a config-and-verification change, not a data migration.

## Technical Context

**Language/Version**: TypeScript on Node.js `>=24.0.0 <25.0.0` (NestJS 10)
**Primary Dependencies**: `@nestjs/*` ^10.4.x, `@prisma/client`/`prisma` ^5.22.0, Jest ^29.7.0
**Storage**: PostgreSQL — upgrading the version referenced in CI from 16 to 18 (no ORM/schema changes)
**Testing**: Jest unit + integration tests, run in GitHub Actions against an ephemeral Postgres service container
**Target Platform**: Linux (GitHub Actions `ubuntu-latest`); no deployment target is defined in-repo (no Dockerfile/IaC)
**Project Type**: Single backend service (NestJS API / WhatsApp bot) — Option 1 (single project) structure
**Performance Goals**: No regression vs. current baseline — CI job wall-clock time and `prisma migrate deploy` duration on PostgreSQL 18 must not exceed the PostgreSQL 16 baseline by more than 10% (Constitution Principle IV)
**Constraints**: No live production/staging PostgreSQL instance to migrate (Mission Brief); no schema or application code changes beyond dependency version bumps; Prisma tooling used must officially support PostgreSQL 18
**Scale/Scope**: 1 CI workflow file, 2 documentation files (`README.md`, `specs/001-dance-performance-bot/quickstart.md`), 1 existing migration (`20260703182806_init`), 2 Prisma models (`TroupeMember`, `Performance`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality**: No application code changes are introduced by this feature (CI config + docs + dependency-version verification only). Standard lint/CI checks still apply to any dependency bump diff. **PASS**.
- **II. Testing Standards (NON-NEGOTIABLE)**: The existing full automated test suite is the verification mechanism — it MUST pass unchanged against PostgreSQL 18 (spec FR-005, SC-003) before merge. No new functionality is added, so no new test *cases* are required, but the suite's pass/fail against PG18 is the acceptance gate itself. **PASS**.
- **III. User Experience Consistency**: Not applicable — no user-facing behavior changes. **PASS (N/A)**.
- **IV. Performance Requirements**: Performance budget defined above (≤10% regression in CI job duration / migration apply time vs. PostgreSQL 16 baseline). No dedicated benchmark exists today; the CI job duration itself (visible in Actions run history) serves as the measured signal for this narrowly-scoped change. **PASS**.

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-upgrade-postgres-18/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/spec-tasks — not created by this command)
```

No `contracts/` directory: this feature changes no public API, CLI surface, or external interface — it is purely a backing-service version bump plus CI/doc updates.

### Source Code (repository root)

```text
# Option 1: Single project (existing structure, unchanged)
src/
├── common/prisma/          # PrismaClient wrapper (unchanged)
├── performances/           # unchanged
├── roster/                 # unchanged
└── whatsapp/                # unchanged

prisma/
├── schema.prisma           # unchanged (datasource provider = "postgresql")
└── migrations/
    └── 20260703182806_init/ # unchanged; must apply cleanly against PostgreSQL 18

.github/workflows/
└── ci.yml                  # CHANGED: postgres:16-alpine → postgres:18-alpine

README.md                             # CHANGED: version references, if any
specs/001-dance-performance-bot/quickstart.md  # CHANGED: version references, if any
.env.example                          # unchanged (no version pin present)
```

**Structure Decision**: Existing single-project (Option 1) NestJS layout is unchanged. This feature touches only `.github/workflows/ci.yml`, developer-facing docs, and (conditionally) the `prisma`/`@prisma/client` dependency versions in `package.json` — no new directories or modules are introduced.

## Phase 0: Outline & Research

See [research.md](./research.md). Key resolved unknowns:
- Whether Prisma 5.22.x (the currently pinned major version) is compatible with PostgreSQL 18.
- What PostgreSQL 18 image tag convention to use in CI, consistent with the existing `postgres:16-alpine` pattern.
- Whether any documentation beyond CI config names a specific PostgreSQL version.

**Output**: research.md — all NEEDS CLARIFICATION resolved (none remained after `/spec-clarify`; this phase resolved implementation-level unknowns not tracked as spec ambiguities).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md).

- **Data model**: No entity, field, or relationship changes. `data-model.md` documents the existing Prisma models as an unchanged reference point and confirms the migration history's SQL is compatible with PostgreSQL 18.
- **Contracts**: Skipped — no public API, CLI, or external interface is added or changed by this feature.
- **Agent context update**: No agent-context extension is installed (`.specify/extensions.yml` has no `agent-context` entry configured), so this step is skipped silently.

**Output**: data-model.md, quickstart.md (no `contracts/` — not applicable)

## Triage Framework: [SYNC] vs [ASYNC] Task Classification

**Execution Strategy**: This feature is small and low-risk; the majority of tasks are agent-delegatable, with human review concentrated on the CI-affecting change itself (standard PR review) rather than any task requiring special synchronous handling.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 0 | 0 | No business logic changes in this feature |
| Data Operations | 0 | 1 | Verifying migration compatibility is mechanical (run `prisma migrate deploy`, inspect output) |
| UI Components | 0 | 0 | No UI surface |
| Integrations | 0 | 1 | Verifying Prisma/PostgreSQL 18 compatibility is a research/verification task, not a design decision |
| Infrastructure | 1 | 1 | Editing `ci.yml` is low-risk but CI changes conventionally get a human glance in review (SYNC = final PR approval); the mechanical version-string edit itself is ASYNC |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- Final review/merge of the CI workflow change — CI misconfiguration silently breaking the merge gate for all future PRs is the one failure mode worth a human look before merge.

**Agent-Delegated [ASYNC] Classifications:**
- Editing the `postgres:16-alpine` → `postgres:18-alpine` image tag in `ci.yml`.
- Updating documentation version references.
- Running the test suite and `prisma migrate deploy` against PostgreSQL 18 and reporting pass/fail.
- Checking Prisma's supported-database documentation/changelog for PostgreSQL 18 status.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Bump CI Postgres image to 18 | ASYNC | Mechanical, single-line, reversible | Low | One-line version string change following an existing, established pattern |
| Verify migration applies on PG18 | ASYNC | Deterministic pass/fail signal from CI run | Low | Either `prisma migrate deploy` succeeds or it doesn't — no judgment call |
| Verify Prisma/PG18 compatibility | ASYNC | Research task with a clear yes/no answer | Low | Checking upstream docs/changelog, not a design decision |
| Update doc version references | ASYNC | Mechanical text edit | Low | Same substitution pattern across a small, known set of files |
| Final PR review & merge | SYNC | Human judgment on CI-gate blast radius | Medium | A broken CI gate blocks every future PR; standard human review before merge per Constitution Quality Gates |

## Complexity Tracking

No violations — table intentionally omitted (Constitution Check passed cleanly above).
