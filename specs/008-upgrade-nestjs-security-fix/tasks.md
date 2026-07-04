# Tasks: Remediate NestJS Core Security Vulnerability

**Input**: Design documents from `/specs/008-upgrade-nestjs-security-fix/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A — no entities), quickstart.md

**Tests**: No new test tasks are generated — this feature validates itself against the existing test suite (unit/integration/contract, including the pre-existing `tests/contract/webhook-latency.bench.ts` performance benchmark). No new product behavior is introduced, so no new tests are required per spec.md.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent validation of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

- **[P]**: Can run in parallel (different files/commands, no dependency on an incomplete task)
- **[SYNC]/[ASYNC]**: Execution mode classification (see plan.md Triage Framework)
- **[Story]**: Maps task to spec.md's US1/US2/US3

## Path Conventions

Single project: `src/`, `tests/` at repository root (per plan.md Project Structure).

---

## Phase 1: Setup

**Purpose**: Capture a pre-upgrade baseline so later regression checks (US2) have something concrete to compare against.

- [X] T001 [ASYNC] Capture baseline: run `npm audit`, `npm test -- --coverage`, and note the current `tests/contract/webhook-latency.bench.ts` p95 result; save the output to `specs/008-upgrade-nestjs-security-fix/baseline.md`

**Checkpoint**: Baseline recorded — safe to start changing dependencies.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Perform the actual dependency upgrade. All user stories validate against the result of this phase, so it must complete first.

**⚠️ CRITICAL**: No user story validation (Phase 3+) can begin until this phase is complete.

- [X] T002 [P] [ASYNC] Update `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/testing` from `^10.4.15` to `^11.1.27` in `package.json` (research.md R1/R2)
- [X] T003 [P] [ASYNC] Update `@nestjs/config` from `^3.3.0` to `^4.0.4` in `package.json` (research.md R3)
- [X] T004 [P] [ASYNC] Update `@nestjs/cli` from `^10.4.9` to `^11.0.23` in `package.json` (research.md R4)
- [X] T005 [ASYNC] Run `npm install` to regenerate `package-lock.json` against the updated version ranges (depends on T002-T004)
- [X] T006 [SYNC] Run `npm run build` and `npm test`; diagnose and fix any v10→v11 breaking-change fallout — check `src/main.ts` and `src/common/config/config.module.ts` first, since those are the only files that touch NestJS bootstrap/config APIs directly (research.md R2/R3) (depends on T005)

**Checkpoint**: Dependencies upgraded, app builds, and the test suite is green locally. User story validation can now begin.

---

## Phase 3: User Story 1 - Remove the known vulnerability (Priority: P1) 🎯 MVP

**Goal**: The application no longer depends on a version of `@nestjs/core` (or `@nestjs/config`/`@nestjs/cli`) affected by a known vulnerability.

**Independent Test**: Run a dependency security audit and confirm no finding references `@nestjs/core`, GHSA-36xv-jgw5-4q75, `@nestjs/config`, or `@nestjs/cli`.

### Implementation for User Story 1

- [X] T007 [P] [ASYNC] [US1] Run `npm audit` and confirm zero findings for `@nestjs/core`, `@nestjs/config`, `@nestjs/cli`, and their previously-flagged transitive dependencies (FR-001, FR-006, FR-008, FR-009, SC-001, SC-005) — **partial**: zero findings for all three named packages; one unrelated residual (`multer`, unreachable) remains, see migration-notes.md
- [X] T008 [P] [ASYNC] [US1] Re-run `npm run build` standalone and confirm it completes without errors (FR-003)

**Checkpoint**: User Story 1 (MVP) is independently verified — the vulnerability is gone and the app builds.

---

## Phase 4: User Story 2 - No regression in bot behavior (Priority: P2)

**Goal**: The WhatsApp bot behaves exactly as before the upgrade.

**Independent Test**: Full automated test suite passes, the app starts cleanly in dev and prod modes, and a manual smoke test of core flows shows no behavioral difference from the T001 baseline.

### Implementation for User Story 2

- [X] T009 [ASYNC] [US2] Run `npm test` and `npm run test:cov`; confirm all tests pass — including `tests/contract/webhook-latency.bench.ts`'s p95 budget — with no coverage decrease versus the `baseline.md` captured in T001 (FR-005, SC-002)
- [X] T010 [P] [ASYNC] [US2] Run `npm run start:dev`, confirm clean startup with no new errors/warnings versus baseline, then stop the process (FR-004, SC-003)
- [X] T011 [P] [ASYNC] [US2] Run `npm run build && npm run start:prod`, confirm clean startup with no new errors/warnings versus baseline, then stop the process (FR-004, SC-003)
- [X] T012 [SYNC] [US2] Perform a manual smoke test of core WhatsApp bot flows — done against the compiled prod build with real HTTP requests and placeholder credentials (signature verification, sender authorization, error handling all verified correct); **real WhatsApp/OpenAI credentials were not available in this environment, so a final human check in staging with live credentials is still recommended before production deploy** (add/cancel/query a performance, group-reply routing) in a non-production environment; confirm behavior matches the pre-upgrade baseline (SC-004) (depends on T009-T011)

**Checkpoint**: User Story 2 is independently verified — no regressions found.

---

## Phase 5: User Story 3 - Document the migration (Priority: P3)

**Goal**: A future maintainer can see what changed and why during the major-version migration.

**Independent Test**: Review the change's documentation and confirm every breaking change encountered is listed alongside the fix applied.

### Implementation for User Story 3

- [X] T013 [SYNC] [US3] Write migration notes documenting any breaking-change adjustments made in T006 during the v10→v11 upgrade (referencing research.md R2's candidate risk areas: Express v5 routing, TypeScript module resolution), in the pull request description or `specs/008-upgrade-nestjs-security-fix/migration-notes.md` (FR-007)

**Checkpoint**: All three user stories are independently verified.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T014 [P] [ASYNC] Run `npm run lint` and `npm run format` and confirm zero new warnings introduced by the upgrade (Constitution Principle I) — lint clean; format flags 9 pre-existing files unrelated to this change (verified: prettier's resolved version unchanged, files not touched)
- [ ] T015 [SYNC] Open the pull request referencing this spec/plan and obtain human review confirming compliance with Code Quality, Testing Standards, User Experience Consistency, and Performance Requirements (Constitution Quality Gates)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first to establish the comparison baseline.
- **Foundational (Phase 2)**: Depends on Setup (T001) completing first so the baseline predates the change. BLOCKS all user stories.
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion. US1, US2, and US3 can then proceed in parallel, though in practice US3 (documentation) naturally follows US1/US2 since it documents what was found during them.
- **Polish (Final Phase)**: Depends on all three user stories being complete.

### Within Phase 2

- T002, T003, T004 are independent file edits to the same file (`package.json`) — parallelizable in intent ([P]) but must be applied as a single combined edit in practice since they touch the same file; sequence them as one commit.
- T005 depends on T002-T004.
- T006 depends on T005.

### Parallel Opportunities

- T002, T003, T004 (conceptually — combine into one `package.json` edit since same file)
- T007 and T008 (Phase 3) — independent commands, can run in parallel
- T010 and T011 (Phase 4) — independent commands, can run in parallel
- T014 (Polish) can run any time after Phase 2 completes, in parallel with Phase 3-5 work

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch both independent verification commands together:
Task: "Run npm audit and confirm zero findings for @nestjs/core, @nestjs/config, @nestjs/cli"
Task: "Re-run npm run build standalone and confirm no errors"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline)
2. Complete Phase 2: Foundational (the actual dependency upgrade — CRITICAL, blocks everything)
3. Complete Phase 3: User Story 1 (confirm vulnerability is gone)
4. **STOP and VALIDATE**: `npm audit` is clean — the security fix itself is done and independently verifiable
5. Continue to US2/US3 before merging, since the constitution's Testing Standards gate requires the full suite green regardless of MVP scoping

### Incremental Delivery

1. Setup + Foundational → dependencies upgraded, builds/tests green locally
2. User Story 1 → audit clean (MVP: the vulnerability is fixed)
3. User Story 2 → full regression validation (required before merge per constitution)
4. User Story 3 → migration notes recorded (required before merge per constitution's PR-must-reference-spec workflow)
5. Polish → lint/format clean, PR reviewed and merged

---

## Notes

- This feature has no independent "team parallelization" story — it is one cohesive dependency upgrade validated from multiple angles (security, regression, documentation), not several independently-deployable slices. Sequencing US1 → US2 → US3 in one PR is expected and matches the constitution's requirement that the full suite pass before any merge.
- Commit after Phase 2 (the actual upgrade) as one logical commit; commit T013's migration notes alongside or as a follow-up commit before opening the PR.
- Avoid: splitting the `package.json` version bumps (T002-T004) into separate commits — `npm install` must resolve them together as one dependency graph.
