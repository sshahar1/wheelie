# Feature Specification: Remediate NestJS Core Security Vulnerability

**Feature Branch**: `008-upgrade-nestjs-security-fix`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Stop using @nestjs/core ^10.4.15, which has a security risk"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove the known vulnerability (Priority: P1)

As the maintainer operating the WhatsApp bot in production, I need the application to stop depending on a version of `@nestjs/core` affected by a known injection vulnerability, so the deployed service is no longer exposed to that risk.

**Why this priority**: This is the entire reason for the change — an active, publicly disclosed vulnerability (GHSA-36xv-jgw5-4q75, CVSS 6.1, "Improperly Neutralizes Special Elements in Output Used by a Downstream Component") affects all `@nestjs/core` versions `<=11.1.17`, which includes the currently pinned `^10.4.15`.

**Independent Test**: Run a dependency audit after the change and confirm the advisory no longer appears against `@nestjs/core` (or any package in the dependency tree).

**Acceptance Scenarios**:

1. **Given** the project's dependency manifest, **When** a security audit is run, **Then** no finding references `@nestjs/core` or GHSA-36xv-jgw5-4q75.
2. **Given** the upgraded dependencies are installed, **When** the application is built, **Then** the build completes without errors.

---

### User Story 2 - No regression in bot behavior (Priority: P2)

As the maintainer, I need the WhatsApp bot to keep working exactly as before after the dependency change, so fixing the vulnerability doesn't trade one incident for another (an outage).

**Why this priority**: The available fix is a major-version upgrade of the NestJS framework (v10 → v11), which can include breaking API changes. Without regression coverage, the remediation itself becomes a risk.

**Independent Test**: Run the full automated test suite and start the application in both development and production modes against the upgraded dependencies; all tests pass and the bot responds to a real WhatsApp message flow in a non-production environment exactly as before.

**Acceptance Scenarios**:

1. **Given** the upgraded dependencies, **When** the automated test suite runs, **Then** all tests pass with no reduction in coverage.
2. **Given** the upgraded dependencies, **When** the application is started in development and production mode, **Then** it starts without new errors or warnings introduced by the upgrade.
3. **Given** the upgraded dependencies in a non-production environment, **When** a manual smoke test of the core bot flows is performed, **Then** behavior matches the pre-upgrade baseline.

---

### User Story 3 - Document the migration (Priority: P3)

As a future maintainer, I need a record of what changed and why during the major-version migration, so I can understand any code adjustments required by the framework upgrade without re-deriving them from scratch.

**Why this priority**: Nice-to-have for maintainability; doesn't block shipping the security fix itself.

**Independent Test**: Review the change's documentation and confirm it lists each breaking change encountered and the corresponding code adjustment.

**Acceptance Scenarios**:

1. **Given** the completed migration, **When** a maintainer reviews the change notes, **Then** every breaking change encountered during the upgrade is listed alongside the fix applied.

---

### Edge Cases

- What happens if the NestJS v11 major upgrade introduces breaking changes in decorators, providers, or configuration APIs actually used by this codebase?
- How is the migration handled if a transitive dependency (e.g., `reflect-metadata`, `rxjs`) requires a compatible version bump alongside the NestJS packages?
- What happens if the patched version still has an open advisory at the time of the upgrade (i.e., no fully clean version exists yet)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST NOT depend, directly or transitively, on any version of `@nestjs/core` affected by GHSA-36xv-jgw5-4q75 (versions `<=11.1.17`).
- **FR-002**: The system MUST upgrade all interdependent NestJS runtime packages (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing`) to mutually compatible, non-vulnerable versions in the same change, since these packages must stay in lockstep to function together.
- **FR-003**: The application MUST build successfully after the upgrade.
- **FR-004**: The application MUST start successfully in both development (`start:dev`) and production (`start:prod`) modes after the upgrade.
- **FR-005**: All existing automated tests MUST pass after the upgrade with no reduction in test coverage.
- **FR-006**: A dependency security audit MUST report no finding attributable to `@nestjs/core` after the change.
- **FR-007**: The change MUST document any breaking API changes encountered during the major-version migration and the corresponding code adjustments made.
- **FR-008**: The system MUST upgrade `@nestjs/config` to a version that resolves its separate, independent moderate-severity advisory as part of this change.
- **FR-009**: The system MUST upgrade `@nestjs/cli` (development-only build tooling) to a version that resolves its transitive vulnerabilities (via `@angular-devkit`, `webpack`, `inquirer`) as part of this change, even though these do not affect the deployed production service.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A dependency security audit reports zero findings associated with `@nestjs/core`, down from the current moderate-severity injection finding.
- **SC-002**: 100% of existing automated tests pass after the upgrade, with no reduction in test coverage.
- **SC-003**: The application starts successfully in development and production modes with zero new errors introduced by the upgrade.
- **SC-004**: A manual smoke test of the WhatsApp bot's core flows in a non-production environment shows no behavioral difference from the pre-upgrade baseline.
- **SC-005**: A dependency security audit reports zero findings across the entire project (not only `@nestjs/core`), reflecting that `@nestjs/config` and `@nestjs/cli`'s vulnerabilities are resolved in the same change.

## Assumptions

- The fix for the `@nestjs/core` advisory requires a major-version upgrade (v10 → v11) of the core NestJS packages, since no patched release exists within the v10 line as of this writing.
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, and `@nestjs/testing` must be upgraded together to compatible versions, since NestJS requires matching major versions across these packages.
- A manual smoke test in a non-production environment is required in addition to automated tests, given this is a production-facing bot and the upgrade is a framework major version change that unit tests may not fully cover.
- `@nestjs/config` and `@nestjs/cli` are separate, independently-versioned packages from `@nestjs/core`; per stakeholder decision, their own vulnerabilities are remediated in this same change rather than tracked separately, since the project is already undergoing a full dependency audit cleanup.
- Upgrading `@nestjs/cli`'s transitive dev tooling (`@angular-devkit`, `webpack`, `inquirer`) may itself be a major-version change; this is accepted as in-scope risk per stakeholder decision, since it only affects the local build/scaffolding tool, not the deployed service.
