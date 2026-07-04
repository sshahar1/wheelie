# Tasks: Upgrade PostgreSQL to Version 18

**Input**: Design documents from `/specs/005-upgrade-postgres-18/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in the spec; verification relies on the existing automated test suite passing against PostgreSQL 18 (spec FR-005), not new test authoring.

**Organization**: Tasks are grouped by user story (US1/US2/US3, priority order from spec.md). [SYNC]/[ASYNC] markers reflect the project's task-classification tool (`tasks-meta-utils.sh classify`), registered in `tasks_meta.json`.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

## Phase 1: Setup

No setup tasks required — no shared infrastructure needs to be created before user story work can begin. This feature only edits existing files.

## Phase 2: Foundational

No foundational/blocking prerequisites — nothing is shared across all three user stories (each touches a distinct file set: CI config, docs, dependency versions).

---

## Phase 3: User Story 1 - CI validates the app against PostgreSQL 18 (Priority: P1) 🎯 MVP

**Goal**: CI provisions PostgreSQL 18 and confirms migrations and tests pass against it.

**Independent Test**: Update the CI service container image and confirm the full test suite, including `prisma migrate deploy` against a fresh database, passes unchanged.

- [X] T001 [SYNC] [US1] Record current CI job duration baseline on `postgres:16-alpine` (read recent Actions run history) before changing the image tag
- [X] T002 [SYNC] [US1] Update `.github/workflows/ci.yml` service container image from `postgres:16-alpine` to `postgres:18-alpine` (depends on T001)
- [X] T003 [SYNC] [US1] Trigger a CI run and confirm the `npx prisma migrate deploy` step succeeds with no errors against PostgreSQL 18 (depends on T002) — verified locally against `postgres:18-alpine` pending an actual CI run post-push
- [X] T004 [ASYNC] [US1] Confirm the full Jest test suite passes in the same PostgreSQL 18 CI run (depends on T002) — verified locally (20/20 suites, 36/36 tests) pending an actual CI run post-push
- [X] T005 [SYNC] [US1] Compare the PostgreSQL 18 CI job duration against the T001 baseline; confirm it is within the 10% regression budget from plan.md (depends on T001, T003, T004) — CI run 28704989213: 49s, within the 47-53s baseline, no regression

**Checkpoint**: CI fully validates the app against PostgreSQL 18 — this alone is a mergeable, independently valuable increment (MVP).

---

## Phase 4: User Story 2 - Contributors set up local environments on PostgreSQL 18 (Priority: P2)

**Goal**: Developer-facing docs point contributors at PostgreSQL 18 so local setups match CI.

**Independent Test**: Follow the quickstart/README setup instructions on a clean machine using a PostgreSQL 18 instance and confirm the app starts and migrations apply without deviating from the documented steps.

- [X] T006 [P] [SYNC] [US2] Update `specs/001-dance-performance-bot/quickstart.md` to reference PostgreSQL 18 wherever a version is implied or named
- [X] T007 [P] [SYNC] [US2] Update `README.md` setup instructions to reference PostgreSQL 18 wherever a version is named
- [X] T008 [P] [SYNC] [US2] Verify `.env.example` requires no version-specific change (it currently contains no version pin) and record the finding

**Checkpoint**: A contributor following the docs from scratch lands on PostgreSQL 18 with no ambiguity.

---

## Phase 5: User Story 3 - Dependency versions confirmed compatible with PostgreSQL 18 (Priority: P3)

**Goal**: Confirm the pinned Prisma tooling officially supports PostgreSQL 18, upgrading only if evidence shows it's needed.

**Independent Test**: Check the installed Prisma version's release notes/support matrix for PostgreSQL 18 support and confirm no breaking changes apply to this project's schema.

- [X] T009 [SYNC] [US3] Check Prisma's official supported-databases documentation/changelog for current PostgreSQL 18 status and record the finding (research.md has a preliminary finding from `/spec-plan` time; confirm it still holds) — confirmed: Prisma docs now officially list PostgreSQL 18 as supported
- [X] T010 [SYNC] [US3] If T003/T004 reveal a Prisma-specific PostgreSQL 18 failure, upgrade `prisma`/`@prisma/client` in `package.json` to the minimum version confirmed compatible and re-run verification; otherwise mark not-applicable and keep the pinned `^5.22.0` version (depends on T003, T004, T009) — not applicable, no incompatibility found, version kept at `^5.22.0`

**Checkpoint**: Prisma/PostgreSQL 18 compatibility is explicitly confirmed and recorded, not assumed.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T011 [ASYNC] Run `specs/005-upgrade-postgres-18/quickstart.md` validation steps end-to-end as a final check (depends on T005, T006, T007, T008, T010) — ran locally ahead of T005 (real CI run); local portion fully passed
- [X] T012 [ASYNC] Final PR review and merge of the PostgreSQL 18 upgrade (depends on T011) — committed and pushed directly to main (6fff546) per user decision; CI green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup / Foundational**: None — skipped, nothing shared blocks story start.
- **User Story 1 (P1)**: No dependency on other stories — can start immediately. Internally sequential (T001→T002→T003→T004→T005, all touching the same CI pipeline).
- **User Story 2 (P2)**: No dependency on other stories or on US1 — can start immediately, fully parallel internally (T006, T007, T008 touch different files).
- **User Story 3 (P3)**: T009 has no dependency and can start immediately; T010 depends on US1's CI results (T003, T004) to know whether an upgrade is actually needed.
- **Polish (Phase 6)**: Depends on all three stories completing.

### Parallel Opportunities

- US1 and US2 can be worked on fully in parallel (different files, no shared state).
- Within US2, T006/T007/T008 can all run in parallel.
- US3's T009 can run in parallel with US1 and US2; only T010 must wait on US1's CI outcome.

---

## Parallel Example: User Story 2

```bash
Task: "Update specs/001-dance-performance-bot/quickstart.md to reference PostgreSQL 18"
Task: "Update README.md setup instructions to reference PostgreSQL 18"
Task: "Verify .env.example requires no version-specific change"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3 (US1): CI runs and passes on PostgreSQL 18.
2. **STOP and VALIDATE**: This alone proves the app works on PostgreSQL 18 and is a safe, minimal merge.

### Incremental Delivery

1. US1 → CI validated on PostgreSQL 18 → mergeable MVP.
2. US2 → docs updated → contributors stop drifting to PostgreSQL 16 locally.
3. US3 → Prisma compatibility explicitly confirmed (or upgraded if evidence requires it) → closes the remaining risk.
4. Polish → end-to-end quickstart validation, then final review/merge.

## Notes

- [SYNC]/[ASYNC] labels come from the project's `tasks-meta-utils.sh classify` heuristic and are also recorded in `tasks_meta.json` for `/spec-implement` gating — treat that file as authoritative if this document and it ever diverge after a re-classification.
- No test-authoring tasks were generated: this feature adds no new functionality, so the existing suite (run against PostgreSQL 18) is the acceptance test, per spec FR-005.
