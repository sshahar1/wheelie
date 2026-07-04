# Tasks: README CI Status Badge

**Input**: Design documents from `/specs/004-readme-ci-badge/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in the spec, and not applicable — this is a static documentation change
with no executable behavior (see plan.md Constitution Check, Testing Standards). Verification is
the manual `quickstart.md` walkthrough instead, included as the final task below.

**Organization**: Tasks are grouped by user story per spec.md.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story] Description`

## Phase 1: Setup & Phase 2: Foundational — Not applicable

No new project, dependency, schema, or infrastructure is introduced by this feature — it edits
one existing file (`README.md`) in the existing repository. There is nothing to set up or
foundation to lay before the user stories below.

---

## Phase 3: User Story 1 - See build health at a glance (Priority: P1) 🎯 MVP

**Goal**: A visitor sees the main branch's CI pass/fail state near the top of the README.

**Independent Test**: Open `README.md` on GitHub and confirm a badge is visible near the top
showing the current CI state.

### Implementation for User Story 1

- [X] T001 [ASYNC] [US1] Add the GitHub Actions CI status badge image (per `research.md` Decision:
  `https://github.com/sshahar1/wheelie/actions/workflows/ci.yml/badge.svg?branch=main`) directly
  under the title in `README.md`

**Checkpoint**: User Story 1 is fully functional — badge is visible and reflects live CI state.

---

## Phase 4: User Story 2 - Jump to the CI run details (Priority: P2)

**Goal**: A visitor can click the badge to reach the workflow's run history/status page.

**Independent Test**: Click the badge in `README.md` and confirm it navigates to
`https://github.com/sshahar1/wheelie/actions/workflows/ci.yml`.

### Implementation for User Story 2

- [X] T002 [ASYNC] [US2] Wrap the badge image added in T001 with a Markdown link to
  `https://github.com/sshahar1/wheelie/actions/workflows/ci.yml` in `README.md` (depends on T001 —
  same line, not parallelizable)

**Checkpoint**: Both user stories complete — badge is visible, live, and clickable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T003 [ASYNC] Run the `specs/004-readme-ci-badge/quickstart.md` validation checklist
  end-to-end (render, state, link-through, placement, no-CI-diff) and confirm all five checks pass

---

## Dependencies & Execution Order

- **User Story 1 (P1)**: No dependencies — can start immediately.
- **User Story 2 (P2)**: Depends on T001 (same file/line — the link wraps the badge image added
  in US1). Not independently parallelizable with US1, but is its own reviewable increment.
- **Polish (T003)**: Depends on T001 and T002 both being complete.

### Parallel Opportunities

None — all three tasks touch the same single line of `README.md` sequentially. This is expected
given the feature's scope (one file, one badge).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 — badge visible and reflecting live CI state.
2. **STOP and VALIDATE**: Confirm the badge renders and shows the correct state.
3. This alone satisfies the core value (SC-001, SC-002) even before the link-through is added.

### Incremental Delivery

1. T001 → Demo: badge visible (MVP).
2. T002 → Demo: badge is now clickable (SC-003).
3. T003 → Final validation pass across all five quickstart checks before considering the feature
   done.
