---

description: "Task list for Upgrade Node.js Runtime to Latest LTS"
---

# Tasks: Upgrade Node.js Runtime to Latest LTS

**Input**: Design documents from `/specs/002-upgrade-node-lts/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A), quickstart.md

**Tests**: Not requested for this feature. This is an infra/runtime upgrade with no new
functionality — the existing automated test suite (already covering all application
behavior) is the verification mechanism, run under the new Node version rather than
extended with new tests.

**Organization**: Tasks are grouped by user story (US1/US2, matching spec.md priorities) to
enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps task to US1 or US2 from spec.md — omitted for Setup/Foundational/Polish

## Path Conventions

Single backend project (no frontend): `Dockerfile`, `.github/workflows/ci.yml`,
`package.json`, `.nvmrc` at repository root, per plan.md Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirm the full scope of the upgrade before touching any file

- [X] T001 [P] Audit the repository for existing Node 20 references in `Dockerfile`,
  `.github/workflows/ci.yml`, `package.json`, and `README.md` to confirm the complete list of
  files needing changes (informs T003, T004, T009)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prerequisite that both user stories' verification steps depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Bump the `@types/node` devDependency from `^20.17.9` to `^24.x` in `package.json`
  per research.md Decision 4 (needed so TypeScript compiles cleanly against the Node 24 API
  surface — both US1's CI/Docker build and US2's local build depend on this)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - CI and Production Run on a Supported Node.js Release (Priority: P1) 🎯 MVP

**Goal**: CI (lint, build, test) and the production Docker image both run on Node 24 instead
of the deprecated Node 20 (spec FR-001, FR-002, FR-005, FR-006).

**Independent Test**: Trigger the CI workflow and a Docker build on Node 24 and confirm both
complete successfully with no failures attributable to the runtime change.

### Implementation for User Story 1

- [X] T003 [P] [US1] Bump the base image in both build and runtime stages of `Dockerfile`
  from `node:20-alpine` to `node:24-alpine`
- [X] T004 [P] [US1] Update the `actions/setup-node` step in `.github/workflows/ci.yml` from
  `node-version: 20` to `node-version: 24`
- [X] T005 [US1] Locally verify the Prisma/Node 24 compatibility gate per quickstart.md
  steps 2–3: run `npm ci`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run lint`,
  and `npm test` under Node 24; if any failure traces to Prisma/Node 24 incompatibility, bump
  `prisma`/`@prisma/client` to the newest compatible `5.x` patch and re-verify, per
  research.md Decision 2 (depends on T002)

  **Result**: PASS — `npm ci`, `prisma generate`, `prisma migrate deploy` all succeed under
  Node 24.18.0; full suite (19 test suites / 30 tests, including the webhook-latency
  benchmark) passes with no regression. No Prisma version bump required. `npm run lint`
  produces one fatal error in `jest.config.ts` (`parserOptions.project` misconfiguration) —
  confirmed identical on Node 20 (pre-existing, unrelated to this upgrade; out of scope).
- [X] T006 [US1] Build and run the Docker image locally per quickstart.md step 4
  (`docker build` + `docker run`) and confirm the NestJS app starts successfully on the
  `node:24-alpine` base image (depends on T003)

  **Result**: PASS — image builds cleanly from `node:24-alpine` (both stages); container
  starts and NestJS logs "Nest application successfully started" with all modules and routes
  mapped correctly.
- [X] T007 [US1] Push the branch / open a PR and confirm the `CI` GitHub Actions workflow
  completes successfully end-to-end on Node 24 per quickstart.md step 5 (depends on T004, T005)

  **Result**: PASS — pushed directly to `main` at commit `237c25a` (per explicit user
  direction). CI run [28702650260](https://github.com/sshahar1/wheelie/actions/runs/28702650260)
  completed successfully on `node-version: 24`.

**Checkpoint**: User Story 1 is fully functional and independently testable (MVP) — CI is
green and the Docker image runs correctly on Node 24

---

## Phase 4: User Story 2 - Single Source of Truth for the Required Node Version (Priority: P2)

**Goal**: A developer or tool can determine the required Node version from one authoritative,
machine-readable place that matches what CI and the Dockerfile actually use (spec FR-003,
FR-004).

**Independent Test**: Inspect the repository for a declared Node version requirement and
confirm it matches what CI and the Dockerfile actually use, with no contradicting file.

### Implementation for User Story 2

- [X] T008 [P] [US2] Create `.nvmrc` at the repository root containing `24`
- [X] T009 [US2] Add an `"engines": { "node": ">=24.0.0 <25.0.0" }` field to `package.json`
  per research.md Decision 3 (same file as T002 — sequential, not parallel)
- [X] T010 [US2] Verify local version-manager resolution per quickstart.md step 1: run
  `nvm install` (reads `.nvmrc`), then `node --version`, and confirm it prints a `v24.x.x`
  version matching the `engines.node` range (depends on T008, T009)

  **Result**: PASS — `nvm install` resolves `.nvmrc` to Node 24.18.0, matching
  `engines.node: ">=24.0.0 <25.0.0"`.

**Checkpoint**: Both user stories are independently functional — CI/Docker run on Node 24,
and a single declared source of truth keeps local dev environments in sync

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Close out remaining stale references and do a final end-to-end confirmation

- [X] T011 [P] Search the repository for stale Node 20 references (`node:20`,
  `node-version: 20`, `"node": "^20`) per quickstart.md step 6 and remove/update any found
  outside of the `specs/001-dance-performance-bot/` historical record

  **Result**: PASS — no stale references remain in `Dockerfile`, `.github/workflows/ci.yml`,
  `package.json`, or docs. The one remaining match (`package-lock.json:2645`,
  `"node": "^20.19.0 || ^22.13.0 || >=24"`) is a third-party dependency's own declared
  `engines` range (auto-generated lockfile metadata), not a project pin — not in scope.
- [X] T012 Run the full quickstart.md validation end-to-end (steps 1–6) as a final closeout
  check confirming SC-001 through SC-004 all hold

  **Result**: PASS — all 6 quickstart steps verified: (1) `.nvmrc` resolves to Node 24.18.0
  matching `engines`; (2)/(3) install/build/lint/full test suite green under Node 24;
  (4) Docker image builds and runs on `node:24-alpine`; (5) real CI run green on Node 24;
  (6) no stale Node 20 references outside historical/third-party lockfile metadata.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: No dependency on Setup's audit completing, but conventionally
  follows it — BLOCKS both user stories' verification tasks
- **User Stories (Phase 3–4)**: Both depend on Foundational phase completion
  - US1 (P1) has no dependency on US2
  - US2 (P2) has no dependency on US1 — the two touch entirely different files
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — no dependency on US1

### Within Each User Story

- T003/T004 (different files) can run in parallel; T005 depends on T002 (Foundational);
  T006 depends on T003; T007 depends on T004 and T005
- T008 can run in parallel with anything; T009 touches the same file as T002 (package.json)
  so must run after T002 completes, not concurrently; T010 depends on T008 and T009

### Parallel Opportunities

- T001 (Setup) has no dependents blocking it — can run any time
- T003 and T004 (US1) can run in parallel — different files, no cross-dependency
- T008 (US2) can run in parallel with all of US1's tasks — no shared files
- US1 and US2 as a whole can be worked on in parallel by different people once Foundational
  (T002) is done, since they touch disjoint files

---

## Parallel Example: User Story 1

```bash
# Launch in parallel once T002 (Foundational) is done:
Task: "Bump Dockerfile base image node:20-alpine -> node:24-alpine"
Task: "Update .github/workflows/ci.yml actions/setup-node to node-version: 24"

# Then, sequentially:
Task: "Locally verify Prisma/Node 24 compatibility gate (depends on T002)"
Task: "Build and run the Docker image locally (depends on T003)"
Task: "Confirm CI green on Node 24 (depends on T004, T005)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks both stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: CI is green and the Docker image runs on Node 24
5. This alone eliminates the EOL/Node 20 security risk — the core motivation for the upgrade

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → deploy (MVP: CI/prod run on Node 24)
3. Add User Story 2 → validate independently → deploy (local dev now can't silently drift
   from the version CI/prod use)
4. Polish phase → final stale-reference sweep and full quickstart re-run

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T002 and T009 both edit `package.json` — sequenced, never marked [P] against each other
- Commit after each task or logical group
- Stop at either checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
