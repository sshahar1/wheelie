# Tasks: Fix Group Reply Routing

**Input**: Design documents from `/specs/003-fix-group-reply-routing/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A), contracts/group-reply-routing.md, quickstart.md

**Tests**: Included — Testing Standards is NON-NEGOTIABLE per the constitution, and research.md
Decision 4 identifies the missing group-shaped test fixture as the root cause this bug shipped
undetected.

**Organization**: This feature has a single user story (US1, P1). Tasks are grouped Setup →
Foundational → User Story 1 → Polish.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[SYNC]**: Requires human review (correctness-critical)
- **[ASYNC]**: Delegable, mechanical/well-specified
- **[Story]**: US1 (only user story in this feature)

---

## Phase 1: Setup

**Purpose**: Establish a pre-change baseline (no new dependencies or project init needed — this
feature adds no infrastructure per plan.md Technical Context)

- [X] T001 [ASYNC] Run `npm test` to confirm the current baseline (30/30 tests passing, none of
  which model a group-shaped payload) before any code changes, per quickstart.md Step 1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capture `group_id` end-to-end so both the new tests and the routing fix have
something to work with

**⚠️ CRITICAL**: T002 blocks every task in Phase 3

- [X] T002 [ASYNC] Add optional `group_id` capture to `WhatsAppWebhookPayload`, `InboundMessage`,
  and `extractInboundMessages()` in `src/modules/whatsapp/whatsapp-webhook-payload.ts` — mirrors
  the inbound shape documented in `contracts/group-reply-routing.md` (research.md Decision 1)
- [X] T003 [P] [ASYNC] Add an optional `groupId` parameter to `buildTextMessagePayload()` in
  `tests/support/webhook-payload-builder.ts`, defaulting to `undefined` so every existing 1:1
  test fixture call is unaffected (research.md Decision 4)

**Checkpoint**: `group_id` now flows from a built test payload through to `InboundMessage` —
User Story 1 work can begin

---

## Phase 3: User Story 1 - Bot Replies Are Visible to the Whole Troupe (Priority: P1) 🎯 MVP

**Goal**: Every bot reply (confirmation, clarifying question, schedule answer, cancellation
confirmation) triggered by a group message is sent back to that group, not DM'd to the sender.

**Independent Test**: Send an add-performance command via a group-shaped payload
(`groupId` set) and confirm the outbound mock request has `recipient_type: "group"` and
`to: <group_id>` — not `to: <from>`.

### Tests for User Story 1 ⚠️

> Write these first; they must FAIL against today's code before T009/T010 land.

- [X] T004 [P] [ASYNC] [US1] New contract test asserting the outbound request shape
  (`recipient_type: "group"`, `to: <group_id>`) for a group-sourced message, vs. the unchanged
  `to: <from>` shape when `group_id` is absent, in
  `tests/contract/whatsapp-webhook.group-reply.test.ts` (contracts/group-reply-routing.md)
- [X] T005 [P] [ASYNC] [US1] Extend `tests/integration/add-performance.test.ts` with a
  group-shaped payload scenario asserting the confirmation reply is sent to the group, not the
  sender (Acceptance Scenario 1)
- [X] T006 [P] [ASYNC] [US1] Extend `tests/integration/add-performance-clarify.test.ts` with a
  group-shaped payload scenario asserting the clarifying question is sent to the group
  (Acceptance Scenario 4)
- [X] T007 [P] [ASYNC] [US1] Extend `tests/integration/query-list.test.ts` with a group-shaped
  payload scenario asserting the schedule answer is sent to the group (Acceptance Scenario 2)
- [X] T008 [P] [ASYNC] [US1] Extend `tests/integration/cancel-performance.test.ts` with a
  group-shaped payload scenario asserting the cancellation confirmation is sent to the group
  (Acceptance Scenario 3)

### Implementation for User Story 1

- [X] T009 [SYNC] [US1] Update `sendTextMessage` in
  `src/modules/whatsapp/whatsapp-client.service.ts` to accept a group destination and send
  `recipient_type: "group"` + `to: <group_id>` when replying to a group, preserving today's
  `to: <from>` shape (no `recipient_type`) for the 1:1 fallback — depends on T002; external API
  contract correctness, so this is human-reviewed (research.md Decision 2)
- [X] T010 [SYNC] [US1] Update `IncomingMessageService.handle()` in
  `src/modules/whatsapp/incoming-message.service.ts` (line 41) to route the reply to
  `message.group_id` when present, falling back to `message.from` otherwise — depends on T002
  and T009; this is the exact bug, so it is human-reviewed (fixes FR-001, FR-002, FR-004)

**Checkpoint**: T004-T008 now pass; the 1:1 fallback path (spec FR-004) remains untouched and
still passes unmodified

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T011 [ASYNC] Run `npm test` and confirm all pre-existing tests still pass unmodified plus
  all new group-routing tests (T004-T008) pass, per quickstart.md Step 3 (SC-001, SC-002, SC-003)
- [X] T012 [ASYNC] Run `npm run lint` on the changed files only and confirm no new lint warnings
  are introduced (the pre-existing, unrelated `jest.config.ts` parserOptions failure is out of
  scope, per Constitution Principle I)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — T002 BLOCKS all of Phase 3
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **Polish (Phase 4)**: Depends on Phase 3 completion

### Within User Story 1

- T004-T008 (tests) before T009-T010 (implementation) — TDD: must fail first, per constitution
  Testing Standards
- T009 (client shape) before T010 (service routing logic) — T010's call site depends on T009's
  new client signature

### Parallel Opportunities

- T002 and T003 touch different files with no dependency between them — safe to run in parallel
- T004, T005, T006, T007, T008 — all touch different files, fully parallel
- T009 and T010 are sequential (see above), not parallel

---

## Parallel Example: User Story 1 tests

```bash
# Launch all US1 tests together (different files, no dependencies on each other):
Task: "Contract test for group-reply outbound shape in tests/contract/whatsapp-webhook.group-reply.test.ts"
Task: "Extend add-performance.test.ts with group-shaped scenario"
Task: "Extend add-performance-clarify.test.ts with group-shaped scenario"
Task: "Extend query-list.test.ts with group-shaped scenario"
Task: "Extend cancel-performance.test.ts with group-shaped scenario"
```

---

## Implementation Strategy

### MVP = This Entire Feature

There is only one user story (P1), so the MVP is the complete fix:

1. Complete Phase 1: Setup (baseline)
2. Complete Phase 2: Foundational (`group_id` capture) — blocks everything else
3. Complete Phase 3: User Story 1 (tests, then the two SYNC implementation tasks)
4. **STOP and VALIDATE**: run quickstart.md Steps 1-3 end to end
5. Complete Phase 4: Polish (full suite + lint)

## Notes

- [P] tasks = different files, no dependencies
- Verify T004-T008 fail before T009/T010 land (TDD)
- T009/T010 are [SYNC] — the exact bug and its external API contract; human review required
  before merge, per plan.md's Triage Audit Trail
- No cross-story dependencies to worry about — single user story
