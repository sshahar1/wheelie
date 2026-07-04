---

description: "Task list for README Logo feature"
---

# Tasks: README Logo

**Input**: Design documents from `/specs/006-readme-logo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A), quickstart.md

**Tests**: Not applicable — this is a static documentation change with no automated
test surface. Verification is the manual quickstart.md render check.

**Organization**: This feature has a single user story (P1), so there is no
Setup or Foundational phase — the existing repo and the pre-existing
`wheelie_logo.png` asset are all the "infrastructure" this needs.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story] Description`

---

## Phase 3: User Story 1 - Logo visible at top of README (Priority: P1) 🎯 MVP

**Goal**: Display `wheelie_logo.png` near the top of `README.md` at a bounded size,
using a relative path, with no regression to existing content.

**Independent Test**: Render `README.md` (GitHub or local Markdown preview) and
confirm the logo displays correctly above the existing project description, with
no broken-image icon and no lost content.

### Implementation for User Story 1

- [X] T001 [SYNC] [US1] Add a bounded-width `wheelie_logo.png` image reference
      immediately above the `# Dance Troupe Performance Bot` title in
      `README.md`, using a relative path (per research.md decision).
- [X] T002 [SYNC] [US1] Run `quickstart.md` validation: render `README.md` and
      confirm the logo displays correctly with no broken-image icon and no
      regression to existing sections.

**Checkpoint**: User Story 1 (the entire feature) is complete and independently
verified.

---

## Dependencies & Execution Order

- **T001** has no dependencies — can start immediately.
- **T002** depends on T001 (renders the result of T001).
- No parallel opportunities: both tasks touch/verify the same file sequentially.

## Implementation Strategy

Single-task MVP: complete T001, then T002 to validate. There is no further
incremental scope for this feature.

## Notes

- Both tasks are classified **SYNC** by `tasks-meta-utils.sh classify` (registered
  in `tasks_meta.json`), so each should get a quick human look before merge even
  though the change itself is low-risk — the plan-level triage estimated ASYNC,
  but the tooling's per-task classification is authoritative here.
- Commit after T001 and T002 together as one small change.
