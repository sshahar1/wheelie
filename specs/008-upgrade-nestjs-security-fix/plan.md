# Implementation Plan: Remediate NestJS Core Security Vulnerability

**Branch**: `008-upgrade-nestjs-security-fix` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-upgrade-nestjs-security-fix/spec.md`

**Note**: This template is filled in by the `/spec.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

`@nestjs/core@^10.4.15` (and its lockstep peers) is affected by GHSA-36xv-jgw5-4q75 (moderate, injection weakness), which has no fix within the 10.x line. The technical approach is a coordinated major-version upgrade of the NestJS framework (v10 → v11) across `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, and `@nestjs/testing`, plus the two additional vulnerabilities the stakeholder chose to bundle into this change: `@nestjs/config` (v3 → v4) and the dev-only `@nestjs/cli` (v10 → v11, pulling in patched `@angular-devkit`/`webpack`/`inquirer`). A repo scan found no wildcard routes, global middleware, duplicated dynamic modules, or `CacheModule` usage — the areas NestJS's own migration guide flags as the main v11 breaking changes — so risk is assessed as low, but is still validated via the full test suite, a build/start check, and a manual smoke test before merge (see `research.md`).

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode) on Node.js `>=24.0.0 <25.0.0`
**Primary Dependencies**: NestJS (`@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/platform-express` — upgrading v10→v11/v3→v4 in this change), Prisma `^5.22.0` (unaffected, unchanged), `openai` SDK (unaffected, unchanged), `rxjs`, `reflect-metadata`
**Storage**: PostgreSQL via Prisma — unaffected by this change; no schema or query changes
**Testing**: Jest (`tests/unit`, `tests/integration`, `tests/contract`), run via `npm test` / `npm run test:cov`
**Target Platform**: Node.js server, deployed on Railway (per existing deployment config)
**Project Type**: Single backend service (WhatsApp bot)
**Performance Goals**: No regression from the existing p95 webhook-ack latency budget (5000ms), already enforced by `tests/contract/webhook-latency.bench.ts` and run as part of `npm test`.
**Constraints**: Must remain compatible with the pinned Node.js `>=24.0.0 <25.0.0` engine range (NestJS v11 requires Node `>=20`, so no conflict). No new runtime dependencies beyond the version bumps themselves.
**Scale/Scope**: Six `package.json` entries change version (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/testing`, `@nestjs/config`, `@nestjs/cli`); no new modules, files, or directories are expected unless the v11 migration requires touching `main.ts` bootstrap or `src/common/config/config.module.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Code Quality | PASS | No new abstractions introduced; a dependency bump plus whatever minimal migration fixes are needed. Standard PR review and lint/static-analysis gates apply unchanged. |
| II. Testing Standards (NON-NEGOTIABLE) | PASS | FR-005/SC-002 already require the full suite to pass with no coverage decrease before merge, matching the constitution's non-negotiable gate. |
| III. User Experience Consistency | PASS | No user-facing behavior is intended to change; SC-004's manual smoke test exists specifically to catch any accidental behavioral drift. |
| IV. Performance Requirements | PASS | `tests/contract/webhook-latency.bench.ts` already defines and enforces a p95 webhook-ack budget (5000ms) as part of the standard test run (`npm test`), which this change's FR-005 already requires to pass with no coverage decrease. No new performance-sensitive paths are introduced. |

**Re-check after Phase 1 design**: No new performance-sensitive code paths, entities, or interfaces are introduced by this feature (see `data-model.md`), so the Phase 1 design does not change this assessment. Gate status unchanged: four PASS, no violations.

## Project Structure

### Documentation (this feature)

```text
specs/008-upgrade-nestjs-security-fix/
├── plan.md              # This file (/spec.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no data entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/spec.tasks command - NOT created by /spec.plan)
```

No `contracts/` directory: this change upgrades internal framework dependencies and introduces no new public API, CLI, or service interface. The bot's existing WhatsApp/webhook contract is unchanged.

### Source Code (repository root)

**Structure Decision**: Existing single-project layout is unchanged — no new directories.

```text
src/
├── common/
│   ├── config/        # ConfigModule — verify against @nestjs/config v4 API (research.md R3)
│   ├── messages/
│   └── prisma/
└── modules/
    ├── extraction/
    ├── performances/
    ├── roster/
    └── whatsapp/

tests/
├── contract/
├── integration/
├── unit/
└── support/
```

Expected file touches: `package.json`, `package-lock.json`, and — only if the build/test run surfaces a v11 breaking change — targeted fixes within `src/main.ts` or `src/common/config/config.module.ts` (the only files identified as touching NestJS bootstrap/config APIs directly).

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid. The mechanical parts of a version bump are agent-delegable; anything touching production framework behavior or requiring a judgment call on "does this still behave the same" is human-reviewed, given this is a security-motivated change to a production service's core framework.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 0 | 0 | No business logic changes in scope |
| Data Operations | 0 | 0 | No schema or query changes in scope |
| UI Components | 0 | 0 | N/A — no UI in this project |
| Integrations | 1 | 0 | Upgrading the framework that every module integrates through requires human review of the migration itself |
| Infrastructure | 2 | 3 | Version-number edits and command execution are mechanical (ASYNC); interpreting results and sign-off are human judgment (SYNC) |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Reviewing and resolving any v10→v11 breaking-change fallout (Express v5 routing/middleware, TypeScript module resolution) surfaced by the build or test run.
- Final manual smoke test of core bot flows and go/no-deploy sign-off.
- PR review of the dependency bump and any accompanying code changes, per the constitution's mandatory human-review gate.

**Agent-Delegated [ASYNC] Classifications:**

- Editing the six `package.json` version ranges to the targets in `research.md`.
- Running `npm install` to regenerate `package-lock.json`.
- Running `npm audit`, `npm run build`, and `npm test`/`npm run test:cov`, and reporting the raw output.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Bump `@nestjs/*` and related versions in `package.json` | ASYNC | Mechanical, deterministic edit | Low | Exact target versions are already specified in `research.md`; no judgment required |
| Run `npm install` / regenerate lockfile | ASYNC | Mechanical command execution | Low | Deterministic tool invocation |
| Run `npm audit`, `npm run build`, `npm test` and capture results | ASYNC | Mechanical command execution | Low | Deterministic tool invocation; results feed the SYNC review step |
| Diagnose and fix any v11 migration breakage (Express v5, module resolution, etc.) | SYNC | Requires framework-specific judgment | Medium | Affects the production request pipeline of a live bot; automated tests may not cover every path |
| Manual smoke test of WhatsApp bot flows pre-deploy | SYNC | Requires human judgment on behavioral equivalence | Medium | This is the primary safeguard against silent regressions per SC-004 |
| PR review and merge approval | SYNC | Constitutional requirement (Code Quality, Testing Standards) | Low | Standard human review gate, unchanged by this feature |

## Complexity Tracking

*No violations — all four Constitution Check gates pass. This section is not applicable.*
