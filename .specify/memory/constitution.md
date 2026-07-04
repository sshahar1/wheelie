<!--
Sync Impact Report
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - I. Code Quality
  - II. Testing Standards (NON-NEGOTIABLE)
  - III. User Experience Consistency
  - IV. Performance Requirements
  - Quality Gates
  - Development Workflow
  - Governance
Removed sections: none (V. principle slot intentionally omitted; see deferred items)
Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ no change needed (Constitution Check section already reads gates generically from this file)
  - .specify/templates/spec-template.md: ✅ no change needed (no hardcoded principle references)
  - .specify/templates/tasks-template.md: ✅ no change needed (no hardcoded principle references)
  - .specify/templates/checklist-template.md: ✅ no change needed
  - .specify/templates/agent-file-template.md: ✅ no change needed
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): confirmed as first-adoption date (today), since no prior constitution existed for this project.
-->

# Wheelie Constitution

## Core Principles

### I. Code Quality
Code merged into the main branch MUST be readable, reviewed, and maintainable by anyone on
the team, not just its author. Every change MUST pass automated linting and static analysis
with zero new warnings before merge. Pull requests MUST receive at least one human review
that checks for correctness, naming clarity, and adherence to existing patterns in the
codebase before approval. Dead code, commented-out blocks, and speculative abstractions not
in active use MUST be removed rather than left "just in case." Complexity MUST be justified:
if a simpler implementation achieves the same behavior, it MUST be preferred.
**Rationale**: Code is read far more often than it is written; unreviewed or unclean code
compounds into defects and slows every future change.

### II. Testing Standards (NON-NEGOTIABLE)
New functionality MUST ship with automated tests covering its primary behavior and known
edge cases. Bug fixes MUST include a regression test that fails before the fix and passes
after. The full automated test suite MUST pass before any merge to the main branch — a red
suite blocks merging, with no exceptions for "will fix later." Contract and integration
tests are REQUIRED for any change that crosses a service boundary, public API, or shared
schema. Test coverage MUST NOT decrease as a result of a change; if it does, the change MUST
add tests to restore it before merge.
**Rationale**: Untested behavior is unverified behavior; regressions caught in production
cost far more than the test that would have caught them in review.

### III. User Experience Consistency
User-facing behavior — terminology, interaction patterns, error messages, and visual
presentation — MUST be consistent across every surface of the product (CLI, UI, API
responses, docs). New features MUST reuse existing interaction patterns and components
rather than introducing a new one unless the existing pattern demonstrably cannot serve the
need. Error messages MUST be actionable: they state what happened and what the user can do
next, not just an internal error code or stack trace. Any deviation from an established
pattern MUST be documented with the reason at the point of change.
**Rationale**: Inconsistent experiences force users to relearn the product repeatedly and
erode trust; consistency is what makes a product feel coherent rather than assembled from
parts.

### IV. Performance Requirements
Every feature MUST define its performance budget (e.g., latency, memory, throughput) during
planning, before implementation begins. Changes that regress a defined performance budget by
more than 10% MUST be flagged in review and either justified explicitly or optimized before
merge. Performance-sensitive code paths MUST be covered by a benchmark or load test that runs
in CI, not validated by manual spot-checks alone. Optimization work MUST be driven by
measurement (profiling data, benchmarks) rather than speculation.
**Rationale**: Performance that is not measured drifts silently; budgets defined up front
turn "feels slow" into a testable, enforceable gate.

## Quality Gates

All four principles above MUST be checked at two points: during plan review (Constitution
Check, before implementation starts) and during pull request review (before merge). A gate
failure blocks progress until resolved or an explicit, documented exception is granted per
the Governance section below. CI MUST enforce, at minimum: linting, the full test suite, and
any registered performance benchmarks — none of these MUST be skippable by configuration
without an approved exception.

## Development Workflow

Work proceeds as: specify → plan → tasks → implement, with a Constitution Check at the plan
stage confirming the approach does not violate any principle above. Pull requests MUST
reference the spec or task they implement. Reviewers MUST verify compliance with Code
Quality, Testing Standards, User Experience Consistency, and Performance Requirements before
approving — silence on a principle in a review is not equivalent to compliance. Any exception
to a principle MUST be recorded in the relevant plan's Complexity Tracking section with a
concrete justification and, where applicable, a remediation plan.

## Governance

This constitution supersedes any conflicting team practice, style guide, or prior informal
convention. Amendments require: (1) a documented rationale for the change, (2) update of this
file with an incremented version per the policy below, and (3) a review of dependent templates
(plan, spec, tasks, checklist) to confirm they remain consistent with the amended text.
Versioning follows semantic versioning: MAJOR for backward-incompatible governance or
principle redefinitions/removals, MINOR for new principles or materially expanded guidance,
PATCH for clarifications and non-semantic wording fixes. All pull requests and reviews MUST
verify compliance with this constitution; unresolved non-compliance blocks merge unless an
exception is explicitly documented per the Development Workflow section above.

**Version**: 1.0.0 | **Ratified**: 2026-07-03 | **Last Amended**: 2026-07-03
