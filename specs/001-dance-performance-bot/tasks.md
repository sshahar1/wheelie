---

description: "Task list for Dance Troupe Performance Bot"
---

# Tasks: Dance Troupe Performance Bot

**Input**: Design documents from `/specs/001-dance-performance-bot/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/whatsapp-webhook.md, quickstart.md

**Tests**: Included — constitution Testing Standards (NON-NEGOTIABLE) requires automated tests
for all new functionality and contract tests for anything crossing a service boundary, so
test tasks are mandatory here, not optional.

**Organization**: Tasks are grouped by user story (US1/US2/US3, matching spec.md priorities) to
enable independent implementation and testing of each story.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[SYNC]/[ASYNC]**: Execution mode per plan.md's Triage Framework (security/foundational/
  correctness-critical work is [SYNC]; well-defined boilerplate is [ASYNC])
- **[Story]**: Maps task to US1, US2, or US3 from spec.md — omitted for Setup/Foundational/Polish

## Path Conventions

Single backend project per plan.md Structure Decision (no frontend): `src/`, `prisma/`,
`tests/` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 [ASYNC] Create project structure: `src/modules/{performances,roster,whatsapp,extraction}/`, `src/common/{messages,config}/`, `prisma/`, `tests/{contract,integration,unit}/` per plan.md
- [X] T002 [ASYNC] Initialize NestJS + TypeScript 5.x project (Node 20 LTS) with dependencies: `@nestjs/core`, `prisma`/`@prisma/client`, `openai`, `jest`, `supertest` in `package.json`
- [X] T003 [P] [ASYNC] Configure ESLint + Prettier (constitution Code Quality gate — zero new warnings) at repo root
- [X] T004 [P] [ASYNC] Configure Jest + Supertest test runner (`jest.config.ts`) with `tests/contract`, `tests/integration`, `tests/unit` projects

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 [SYNC] Design and write Prisma schema for `Performance` and `TroupeMember` in `prisma/schema.prisma` per data-model.md (foundational/hard-to-change — human review required before migrating)
- [X] T006 [ASYNC] Generate and apply the initial Prisma migration in `prisma/migrations/` (depends on T005)
- [X] T007 [SYNC] Implement Meta webhook signature verification guard in `src/modules/whatsapp/signature.guard.ts` per contracts/whatsapp-webhook.md §2 (security-critical)
- [X] T008 [P] [SYNC] Implement roster-based sender authorization service in `src/modules/roster/roster.service.ts` (security-critical; resolves sender phone number → TroupeMember or "unauthorized")
- [X] T009 [P] [ASYNC] Implement `TroupeMember` repository (create/find-by-phone) in `src/modules/roster/roster.repository.ts` (depends on T006)
- [X] T010 [P] [ASYNC] Implement shared reply-formatting module (confirmation/clarify/answer/not-found templates) in `src/common/messages/reply-formatter.ts` (constitution UX Consistency — single source of bot tone/structure)
- [X] T011 [P] [ASYNC] Implement Meta Cloud API outbound send-message client wrapper in `src/modules/whatsapp/whatsapp-client.service.ts` per contracts/whatsapp-webhook.md §3
- [X] T012 [ASYNC] Implement config module for `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `OPENAI_API_KEY` in `src/common/config/config.module.ts`
- [X] T013 [SYNC] Implement webhook controller skeleton: GET verification handshake + POST inbound entrypoint (ack `200`, delegate processing) in `src/modules/whatsapp/whatsapp.controller.ts` per contracts/whatsapp-webhook.md §1–2 (depends on T007, T008, T011, T012)
- [X] T014 [SYNC] Implement activation-keyword/mention detection in `src/modules/whatsapp/activation.util.ts` per research.md §3

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Add a Performance to the Schedule (Priority: P1) 🎯 MVP

**Goal**: An authorized member posts a natural-language message with a performance's date and
location; the bot extracts, stores, and confirms it — or asks a clarifying question if a
required detail is missing (spec FR-001–005).

**Independent Test**: Send "We have a show at the community center on August 14th at 7pm" to
the group and verify the bot confirms a stored performance with the correct date, time, and
location — independent of any query or cancel feature.

### Tests for User Story 1 ⚠️

> Write these tests FIRST, ensure they FAIL before implementation

- [X] T015 [P] [ASYNC] [US1] Contract test: inbound add-performance webhook payload accepted and acked in `tests/contract/whatsapp-webhook.add.test.ts`
- [X] T016 [P] [ASYNC] [US1] Integration test: well-formed message → confirmation reply with correct stored date/time/location in `tests/integration/add-performance.test.ts`
- [X] T017 [P] [ASYNC] [US1] Integration test: message missing location → clarifying-question reply, no record created in `tests/integration/add-performance-clarify.test.ts`
- [X] T018 [P] [ASYNC] [US1] Integration test: update to an existing performance (e.g., location change) updates the same record rather than duplicating in `tests/integration/update-performance.test.ts`

### Implementation for User Story 1

- [X] T019 [P] [ASYNC] [US1] Implement `Performance` repository (create/find-by-date/update) in `src/modules/performances/performances.repository.ts` (depends on T006)
- [X] T020 [SYNC] [US1] Implement NL extraction service — OpenAI structured tool-call schema (date/time/location/notes/confidence) per research.md §4 in `src/modules/extraction/extraction.service.ts` (correctness-critical)
- [X] T021 [SYNC] [US1] Implement add/update-performance service logic (validate required fields, match existing record by date, call repository) in `src/modules/performances/performances.service.ts` (depends on T019, T020)
- [X] T022 [ASYNC] [US1] Wire add/update flow into webhook controller (activation check → extraction → service → confirmation/clarify reply) in `src/modules/whatsapp/whatsapp.controller.ts` (depends on T013, T014, T021)
- [X] T023 [ASYNC] [US1] Add confirmation and clarifying-question templates to `src/common/messages/reply-formatter.ts` (depends on T010)

**Checkpoint**: User Story 1 is fully functional and independently testable (MVP)

---

## Phase 4: User Story 2 - Ask About Upcoming Performances (Priority: P2)

**Goal**: Any member asks a natural-language schedule question and gets an answer grounded
only in stored performance data (spec FR-007–009).

**Independent Test**: Seed one or more stored performances and verify the bot answers
date/location questions correctly, independent of the add/update flow used to create the data.

### Tests for User Story 2 ⚠️

- [X] T024 [P] [ASYNC] [US2] Contract test: inbound query-type webhook payload accepted and acked in `tests/contract/whatsapp-webhook.query.test.ts`
- [X] T025 [P] [ASYNC] [US2] Integration test: "what's our next performance?" → correct answer from stored data in `tests/integration/query-next-performance.test.ts`
- [X] T026 [P] [ASYNC] [US2] Integration test: question about a date with nothing scheduled → clear none-found reply, no fabrication in `tests/integration/query-none-found.test.ts`
- [X] T027 [P] [ASYNC] [US2] Integration test: request for full upcoming schedule → all future performances listed in chronological order in `tests/integration/query-list.test.ts`

### Implementation for User Story 2

- [X] T028 [SYNC] [US2] Implement query service — next performance, by-date lookup, full upcoming list via direct DB queries per research.md §5 in `src/modules/performances/performances-query.service.ts` (depends on T019)
- [X] T029 [SYNC] [US2] Implement grounded-answer phrasing (LLM phrases only the already-retrieved query result; never given open DB access) in `src/modules/extraction/grounded-answer.service.ts` (depends on T028)
- [X] T030 [ASYNC] [US2] Wire query flow into webhook controller (activation check → intent detection → query service → grounded reply) in `src/modules/whatsapp/whatsapp.controller.ts` (depends on T013, T014, T029)
- [X] T031 [ASYNC] [US2] Add query-answer and none-found templates to `src/common/messages/reply-formatter.ts` (depends on T010)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Cancel or Remove a Performance (Priority: P3)

**Goal**: An authorized member cancels a previously scheduled performance; it's excluded from
all future "upcoming" queries (spec FR-006).

**Independent Test**: Cancel a previously seeded performance and verify it no longer appears in
"upcoming performances" queries, independent of how it was originally created.

### Tests for User Story 3 ⚠️

- [X] T032 [P] [ASYNC] [US3] Contract test: inbound cancel-type webhook payload accepted and acked in `tests/contract/whatsapp-webhook.cancel.test.ts`
- [X] T033 [P] [ASYNC] [US3] Integration test: cancel an existing upcoming performance → excluded from subsequent upcoming-query results in `tests/integration/cancel-performance.test.ts`
- [X] T034 [P] [ASYNC] [US3] Integration test: cancel a non-existent or already-past performance → not-found reply in `tests/integration/cancel-not-found.test.ts`

### Implementation for User Story 3

- [X] T035 [ASYNC] [US3] Implement cancel-performance service logic (status transition `upcoming` → `cancelled`) in `src/modules/performances/performances.service.ts` (depends on T019, T021)
- [X] T036 [ASYNC] [US3] Wire cancel flow into webhook controller (activation check → intent detection → service → confirmation reply) in `src/modules/whatsapp/whatsapp.controller.ts` (depends on T013, T014, T035)
- [X] T037 [ASYNC] [US3] Add cancellation-confirmation and not-found templates to `src/common/messages/reply-formatter.ts` (depends on T010)

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements spanning all user stories; constitution Performance Requirements and
Development Workflow closeout

- [X] T038 [P] [ASYNC] Unit tests for activation-keyword/mention detection edge cases in `tests/unit/activation.util.test.ts`
- [X] T039 [P] [ASYNC] Unit tests for extraction schema validation edge cases (ambiguous relative dates, past dates) in `tests/unit/extraction.service.test.ts`
- [X] T040 [ASYNC] Webhook-to-reply latency benchmark against the 5s p95 budget (plan.md Performance Requirements) in `tests/contract/webhook-latency.bench.ts`
- [X] T041 [P] [ASYNC] Write setup README referencing quickstart.md at repo root `README.md`
- [X] T042 [ASYNC] Run full quickstart.md validation manually end-to-end against a real Meta test number and roster
- [X] T043 [ASYNC] Docker + CI scaffolding (Dockerfile, CI pipeline running lint + full test suite + latency benchmark per constitution Quality Gates)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1 (P1) has no dependency on US2/US3
  - US2 (P2) depends only on the shared `Performance` repository (T019) from US1's phase, not on US1's service logic — reuses the model, not the add/update behavior
  - US3 (P3) depends on T019 and T021 (extends the same service file with a cancel transition) but is independently testable once present
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) and after T019 (Performance repository) exists; independently testable via seeded data rather than requiring the add-flow to run first
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) and after T019/T021 exist (extends the same performances.service.ts file); independently testable via seeded data

### Within Each User Story

- Tests MUST be written and FAIL before implementation (constitution Testing Standards)
- Repository/model tasks before service tasks
- Service tasks before webhook-controller wiring
- Story complete (checkpoint) before moving to the next priority, if working sequentially

### Parallel Opportunities

- T003, T004 (Setup) can run in parallel
- T008, T009, T010, T011 (Foundational) can run in parallel — different files, no cross-dependencies
- Once Foundational completes, US1/US2/US3 test-writing tasks within each phase (all marked [P]) can run in parallel
- T019 is a shared dependency for US2 and US3 — must complete before those phases' service tasks, but US1's remaining tasks (T020–T023) can proceed in parallel with US2/US3 test-writing

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test: inbound add-performance webhook payload in tests/contract/whatsapp-webhook.add.test.ts"
Task: "Integration test: well-formed message → confirmation reply in tests/integration/add-performance.test.ts"
Task: "Integration test: missing location → clarifying question in tests/integration/add-performance-clarify.test.ts"
Task: "Integration test: update existing performance → same record updated in tests/integration/update-performance.test.ts"

# Then, once tests are red:
Task: "Create Performance repository in src/modules/performances/performances.repository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md steps 1 (add) independently
5. Deploy/demo if ready — a troupe can already record and get confirmation on performances

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → deploy (MVP: schedule recording works)
3. Add User Story 2 → validate independently → deploy (members can now ask "what's next")
4. Add User Story 3 → validate independently → deploy (cancellations now supported)
5. Polish phase → benchmarks, docs, CI hardening

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- [SYNC]/[ASYNC] classification follows plan.md's Triage Framework and Audit Trail — security-,
  foundational-, and correctness-critical tasks are [SYNC]; well-specified boilerplate is
  [ASYNC]
- Verify tests fail before implementing (constitution Testing Standards, NON-NEGOTIABLE)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence

---

## Phase 7: Convergence

- [X] T044 CRITICAL: Add integration test verifying messages from unrecognized/non-roster senders are silently ignored (no reply sent, no DB mutation) per Constitution II (Testing Standards) / FR-010 (missing)
- [X] T045 CRITICAL: Add integration test verifying a roster member's message without the activation keyword is ignored (no processing, no reply sent) per Constitution II (Testing Standards) / Edge Cases #4 (missing)
- [X] T046 CRITICAL: Add integration tests covering the query_date intent path for both a matched date and a no-match date per Constitution II (Testing Standards) / US2 AC2, FR-007, FR-009 (missing)
- [X] T047 Clarify expected behavior for adding a performance with an already-past date and add corresponding test coverage per spec Edge Cases (partial)

**Resolution for T047**: a performance may still be added/updated with a past date (no
rejection rule exists in data-model.md, and a message about a just-missed show is a
legitimate late entry). However, `PerformancesRepository.findUpcoming`/`findNextUpcoming`
now additionally filter `date >= today`, so a past-dated row (even with `status: upcoming`)
never surfaces as "next" or in the upcoming list — preserving SC-002's accuracy guarantee.
Covered by `tests/integration/past-date-performance.test.ts`.
