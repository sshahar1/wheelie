# Feature Specification: Upgrade PostgreSQL to Version 18

**Feature Branch**: `005-upgrade-postgres-18`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Upgrade postgres to 18"

## Mission Brief

**Goal**: Upgrade PostgreSQL from version 16 to version 18 across CI configuration, developer documentation, and Prisma tooling, with the application verified compatible.

**Success Criteria**:
- CI runs 100% of tests against PostgreSQL 18, with zero PostgreSQL 16 references remaining in CI config
- The existing Prisma migration history applies cleanly to a fresh PostgreSQL 18 database with zero errors
- The full test suite passes on PostgreSQL 18 at the same pass rate it currently achieves on PostgreSQL 16

**Constraints**:
- No production/staging PostgreSQL instance exists in-repo (only the ephemeral CI service container is version-pinned), so no live-data migration is in scope
- No schema or application code changes beyond dependency version bumps (Prisma client/CLI) should be required
- Prisma tooling version used must officially support PostgreSQL 18

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CI validates the app against PostgreSQL 18 (Priority: P1)

As a maintainer, I want the CI pipeline to run all tests and migrations against PostgreSQL 18 so that I know the application and its schema work correctly on the new major version before anyone relies on it.

**Why this priority**: CI is the only place PostgreSQL is currently version-pinned (`postgres:16-alpine` in the GitHub Actions workflow). This is the highest-value, lowest-risk change and gives an automated safety net for every other part of the upgrade.

**Independent Test**: Update the CI service container image and confirm the full test suite, including `prisma migrate deploy` against a fresh database, passes unchanged.

**Acceptance Scenarios**:

1. **Given** the CI workflow, **When** the test job runs, **Then** it provisions a PostgreSQL 18 service container instead of PostgreSQL 16.
2. **Given** a PostgreSQL 18 service container with no existing schema, **When** `prisma migrate deploy` runs, **Then** the existing migration (`20260703182806_init`) applies successfully with no errors.
3. **Given** the migrated PostgreSQL 18 database, **When** the existing test suite runs, **Then** all tests pass with no PostgreSQL-version-related failures.

---

### User Story 2 - Contributors set up local environments on PostgreSQL 18 (Priority: P2)

As a contributor setting up the project locally, I want the documentation to point me at PostgreSQL 18 so my local database matches what CI and other contributors use.

**Why this priority**: Prevents environment drift ("works on 16, breaks on 18") between contributors' machines and CI. Lower priority than CI because it's documentation-only and doesn't block automated verification.

**Independent Test**: Follow the quickstart/README setup instructions on a clean machine using a PostgreSQL 18 instance and confirm the app starts and migrations apply without deviating from the documented steps.

**Acceptance Scenarios**:

1. **Given** the quickstart guide, **When** a contributor provisions a local database per the instructions, **Then** the instructions reference PostgreSQL 18 (e.g., in any suggested container image).
2. **Given** a freshly provisioned PostgreSQL 18 local database, **When** a contributor runs `prisma migrate dev`, **Then** the schema applies successfully.

---

### User Story 3 - Dependency versions confirmed compatible with PostgreSQL 18 (Priority: P3)

As a maintainer, I want confirmation that the ORM/driver tooling (Prisma) the app depends on officially supports PostgreSQL 18, so the upgrade doesn't silently rely on unsupported behavior.

**Why this priority**: Lower priority because it's a verification/documentation step rather than a functional change — if Prisma already supports PostgreSQL 18 (as expected for the version in use), no action beyond confirming and recording it is needed.

**Independent Test**: Check the installed Prisma version's release notes/support matrix for PostgreSQL 18 support and confirm no breaking changes apply to this project's schema.

**Acceptance Scenarios**:

1. **Given** the project's pinned Prisma version, **When** its documented database support matrix is checked, **Then** PostgreSQL 18 is a supported target.
2. **Given** the project's Prisma schema, **When** compared against PostgreSQL 18's changelog, **Then** no schema feature in use has changed behavior or been removed.

---

### Edge Cases

- What happens if the pinned Prisma version does not yet officially support PostgreSQL 18? (Requires bumping Prisma to a supporting version as part of this change.)
- How does the existing initial migration behave if PostgreSQL 18 changes default behavior for any SQL construct it uses (e.g., identity columns, constraint syntax)?
- What happens for a contributor who already has a local PostgreSQL 16 (or other version) instance running — is a side-by-side or replaced instance expected?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI workflow MUST provision PostgreSQL 18 (not 16) as the database service used for running migrations and tests.
- **FR-002**: The existing Prisma migration history MUST apply cleanly against a fresh PostgreSQL 18 database with no manual intervention.
- **FR-003**: All references to a specific PostgreSQL version in project documentation (README, quickstart guides, example env files) MUST be updated to PostgreSQL 18 wherever a version is named.
- **FR-004**: The Prisma client and CLI dependency versions MUST support PostgreSQL 18; if the currently pinned version does not, it MUST be upgraded to one that does.
- **FR-005**: The full automated test suite MUST pass against PostgreSQL 18 with no test changes required to work around version-specific behavior differences.

### Key Entities

- **Database service version**: The PostgreSQL major version (16 → 18) referenced in CI configuration and developer-facing setup documentation. No application data entities are affected by this change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of CI test runs execute against PostgreSQL 18, with zero references to PostgreSQL 16 remaining in CI configuration.
- **SC-002**: The existing migration history applies to a clean PostgreSQL 18 database in a single command with zero errors.
- **SC-003**: The full test suite passes on PostgreSQL 18 with the same pass rate as it currently achieves on PostgreSQL 16 (no new failures introduced by the version change).
- **SC-004**: A contributor following the setup documentation from scratch ends up running PostgreSQL 18 with no ambiguity about which version to install.

## Assumptions

- No production or staging PostgreSQL instance is managed by this repository today (no Docker Compose, Dockerfile, or infrastructure-as-code was found referencing PostgreSQL); the only version-pinned instance is the ephemeral CI service container. This change is therefore scoped to CI configuration, documentation, and dependency compatibility — not an in-place data migration of a live database.
- "PostgreSQL 18" refers to the latest stable PostgreSQL 18.x release, matching the existing convention of using a floating major-version tag (e.g., `postgres:18-alpine`) rather than pinning an exact patch version.
- The project's Prisma schema uses only standard, widely-supported PostgreSQL features (no custom extensions), so no schema changes are expected to be required for PostgreSQL 18 compatibility beyond what FR-004 covers for tooling versions.
- Any developer or deployment environment currently running PostgreSQL 16 locally is expected to upgrade or recreate their local database; no automated local-upgrade tooling is in scope.
