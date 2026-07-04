# Feature Specification: README CI Status Badge

**Feature Branch**: `[004-readme-ci-badge]`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Add to the readme a CI status indicator"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See build health at a glance (Priority: P1)

A visitor (contributor, maintainer, or prospective user) opens the repository's README and immediately sees whether the latest build on the main branch is passing or failing, without navigating to the CI provider's site.

**Why this priority**: This is the entire feature — a visible, at-a-glance status signal is the sole deliverable.

**Independent Test**: Open the README on GitHub and confirm a badge is visible near the top showing the current CI state, fully deliverable on its own.

**Acceptance Scenarios**:

1. **Given** the main branch's most recent CI run passed, **When** a visitor views the README, **Then** the badge displays a "passing" state.
2. **Given** the main branch's most recent CI run failed, **When** a visitor views the README, **Then** the badge displays a "failing" state.

---

### User Story 2 - Jump to the CI run details (Priority: P2)

A visitor clicks the badge to see the underlying workflow run for more detail (logs, history, which job failed).

**Why this priority**: Secondary convenience — the badge's primary value is the at-a-glance signal (P1); linking through is a nice-to-have that most badge implementations provide for free.

**Independent Test**: Click the badge and confirm it navigates to the CI workflow's run history/status page.

**Acceptance Scenarios**:

1. **Given** the badge is displayed, **When** a visitor clicks it, **Then** they are taken to the CI workflow's status/history page for the repository.

---

### Edge Cases

- What happens when CI has never run on the main branch (e.g., a fresh fork with no Actions history)? The badge should show a neutral/"no status" state rather than a broken image, per the badge provider's default behavior.
- What happens if the workflow file or workflow name referenced by the badge is later renamed? The badge would break/show "not found" — out of scope to guard against, but noted as a maintenance dependency in Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The README MUST display a visual badge indicating the current CI status of the main branch.
- **FR-002**: The badge MUST reflect, without manual updates, the actual current state of the most recent CI run on the main branch (auto-updating, not a static image).
- **FR-003**: The badge MUST be placed near the top of the README so it is visible without scrolling on first view.
- **FR-004**: The badge MUST link to the corresponding CI workflow's run/status page when clicked.
- **FR-005**: The change MUST NOT alter the CI workflow's behavior, triggers, or configuration — documentation only.

### Key Entities

- **CI Workflow Run**: The existing GitHub Actions workflow execution on the main branch; the badge surfaces its latest status (passing/failing/no runs) and links to its history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can determine the main branch's build health within 2 seconds of opening the README, without leaving the page.
- **SC-002**: The badge's displayed state matches the actual latest main-branch CI run state 100% of the time (no manual/stale updates required).
- **SC-003**: Clicking the badge successfully lands on the CI run history page 100% of the time.

## Assumptions

- The repository's existing GitHub Actions workflow (`ci.yml`) is the workflow the badge reports on; no new or modified CI workflow is required.
- The badge is generated via GitHub's standard workflow-status badge mechanism (auto-updating hosted image + link), consistent with common open-source README conventions.
- The badge reports the `main` branch specifically, matching this repository's primary branch.
- The repository's GitHub-hosted location (`sshahar1/wheelie`) is stable and is the correct target for the badge's link/image source.
