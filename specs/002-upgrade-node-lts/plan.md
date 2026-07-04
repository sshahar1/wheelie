# Implementation Plan: Upgrade Node.js Runtime to Latest LTS

**Branch**: `002-upgrade-node-lts` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-upgrade-node-lts/spec.md`

## Summary

Move the project's Node.js runtime off the deprecated, EOL Node 20 onto Node 24 (current
Active LTS) everywhere it's declared or pinned — CI workflow, Dockerfile, and a newly-added
`package.json` `engines` + `.nvmrc` single source of truth — with no application behavior
change. The only technical risk identified in research is that `@prisma/client` 5.22
predates Prisma's explicit Node 24 support statement; the plan treats "full test suite green
on Node 24 in CI" as the compatibility gate and only bumps Prisma if that gate fails (see
`research.md` Decision 2).

## Technical Context

**Language/Version**: TypeScript 5.7, running on Node.js 20 today → Node.js 24 (target)
**Primary Dependencies**: NestJS 10.4, `@prisma/client`/`prisma` 5.22, `openai` 4.77,
`reflect-metadata`, `rxjs` — no dependency additions/removals, version bumps only where the
Node 24 compatibility gate requires them (see research.md Decision 2 and 4)
**Storage**: PostgreSQL 16 via Prisma — unaffected by this change
**Testing**: Jest 29 + Supertest 7 + `ts-jest` (existing contract/integration/unit suites)
**Target Platform**: Linux server — Docker (`node:24-alpine`) and GitHub Actions CI
(`ubuntu-latest`)
**Project Type**: Single backend service (NestJS) — no frontend
**Performance Goals**: No new performance goals; must not regress the existing 5s p95
webhook-to-reply budget (`tests/contract/webhook-latency.bench.ts` from the prior feature)
**Constraints**: Zero functional/behavioral regression; CI and Docker build must succeed on
Node 24; `@prisma/client` 5.22 has no officially-documented Node 24 support (research.md
Decision 2) and must be verified, with a documented fallback if verification fails
**Scale/Scope**: Config-only change — `Dockerfile`, `.github/workflows/ci.yml`,
`package.json` (`engines`, `@types/node`), new `.nvmrc`; no new source directories, entities,
or endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Assessment |
|---|---|---|
| I. Code Quality | Zero new lint warnings; no speculative abstractions | **PASS** — change is confined to config/pin edits; no new code paths introduced |
| II. Testing Standards (NON-NEGOTIABLE) | Full automated suite MUST pass before merge | **PASS** — quickstart.md step 3 and CI (SC-001) make "full suite green on Node 24" the explicit merge gate; no test behavior is altered, only the runtime it executes under |
| III. UX Consistency | User-facing behavior unchanged | **PASS** — spec explicitly scopes this as infra-only with no application behavior change |
| IV. Performance Requirements | No regression >10% vs. defined budget | **PASS** — existing webhook-latency benchmark re-runs in CI on Node 24 as part of the same test gate; any regression is caught before merge, not spot-checked |

No violations identified. Complexity Tracking table below is not applicable.

Re-checked after Phase 1 design: unchanged — no new entities, contracts, or architectural
elements were introduced, so all four gates still hold as assessed above.

## Project Structure

### Documentation (this feature)

```text
specs/002-upgrade-node-lts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no new entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

No `contracts/` directory is generated for this feature — it introduces no new external
interface; the existing `specs/001-dance-performance-bot/contracts/whatsapp-webhook.md`
contract is untouched.

### Source Code (repository root)

This feature touches configuration only, reusing the existing single-project layout from
`specs/001-dance-performance-bot/plan.md` (no new directories):

```text
Dockerfile                       # base image bump: node:20-alpine → node:24-alpine
.github/workflows/ci.yml         # actions/setup-node: node-version 20 → 24
package.json                     # add "engines": { "node": ">=24.0.0 <25.0.0" }; bump @types/node
.nvmrc                           # new file: "24"

src/                             # unchanged — no source edits expected
prisma/                          # unchanged, but must be re-verified against Node 24 (research.md #2)
tests/                           # unchanged — existing suite is the compatibility gate
```

**Structure Decision**: Single backend project (unchanged from feature 001). This feature
adds no new source directories — only root-level config/pin files and one new dotfile
(`.nvmrc`).

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: This feature will use a hybrid execution model combining human expertise ([SYNC]) with autonomous agent delegation ([ASYNC]).

### Preliminary Task Classification

Complete during planning phase - will be validated and refined during task generation

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 0 | 0 | No application logic changes in scope |
| Data Operations | 1 | 0 | Verifying/handling Prisma-on-Node-24 compatibility touches the data layer and has an undetermined outcome — needs human judgment |
| UI Components | 0 | 0 | N/A — no UI in this project |
| Integrations | 1 | 0 | CI workflow edit controls the merge gate itself; reviewed by a human before it's trusted |
| Infrastructure | 1 | 3 | Dockerfile/`.nvmrc`/`engines`/`@types/node` edits are mechanical, well-specified pin bumps; the local dev-environment validation step is routine |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Verifying (and, if needed, bumping) Prisma's Node 24 compatibility — outcome is not fully
  knowable until the full test suite runs; a failure here affects data correctness, not just
  config
- Updating `.github/workflows/ci.yml` — this file defines the merge gate itself; an error here
  silently weakens the "full suite must pass" constitution requirement

**Agent-Delegated [ASYNC] Classifications:**

- Bumping the Dockerfile base image from `node:20-alpine` to `node:24-alpine`
- Adding `.nvmrc` and `package.json` `engines.node`
- Bumping the `@types/node` devDependency to match the new major
- Running the quickstart.md local validation steps (install, build, lint) and reporting results

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Verify/handle Prisma Node 24 compatibility | [SYNC] | Correctness-critical, undetermined outcome | Medium | Only Prisma 6/7 officially declare Node 24 support (research.md #2); needs a human to interpret test results and decide on a Prisma bump if the gate fails |
| Update `.github/workflows/ci.yml` | [SYNC] | Controls the merge/quality gate | Medium | A mistake here could silently disable or weaken the test/lint gate the constitution requires |
| Bump Dockerfile base image | [ASYNC] | Well-defined, single-line pin change | Low | Mechanical version-string swap, verified by the Docker build in quickstart.md step 4 |
| Add `.nvmrc` + `engines.node` | [ASYNC] | Well-defined, additive config | Low | New file/field with an unambiguous value from research.md #3 |
| Bump `@types/node` | [ASYNC] | Well-defined dependency bump | Low | Verified mechanically by `npm run build`/`tsc` succeeding |

## Complexity Tracking

Not applicable — the Constitution Check above identified no violations to justify.
