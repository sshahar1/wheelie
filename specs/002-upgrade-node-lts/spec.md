# Feature Specification: Upgrade Node.js Runtime to Latest LTS

**Feature Branch**: `[002-upgrade-node-lts]`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Upgrade the project from nodejs 20 which is deprecated, to the latest nodejs version"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CI and Production Run on a Supported Node.js Release (Priority: P1)

A maintainer pushes a commit or opens a pull request. The CI pipeline builds, lints, and tests
the project, and the production Docker image is built — all on a current, supported Node.js LTS
release instead of the deprecated Node 20.

**Why this priority**: Node 20 is deprecated/EOL, meaning it no longer receives security patches.
This is the core risk the upgrade eliminates and delivers value on its own, independent of any
developer-experience polish.

**Independent Test**: Trigger the CI workflow and a Docker build on the new Node version and
confirm both complete successfully with no failures attributable to the runtime change.

**Acceptance Scenarios**:

1. **Given** a pull request is opened, **When** the CI workflow runs, **Then** it installs
   dependencies, generates the Prisma client, runs migrations, lints, and runs the full test
   suite on the new Node.js LTS version with no failures caused by the version change.
2. **Given** the production Docker image is built, **When** the build completes, **Then** the
   resulting container starts the application successfully on the new Node.js LTS base image.

---

### User Story 2 - Single Source of Truth for the Required Node Version (Priority: P2)

A developer setting up the project locally, or a tool inspecting the repository, can determine
the required Node.js version from one authoritative, machine-readable place rather than having to
cross-check the Dockerfile and CI workflow.

**Why this priority**: Prevents version drift between local dev, CI, and production once the
upgrade lands — a common source of "works on my machine" bugs — but the project can function
without it if US1 alone is delivered.

**Independent Test**: Inspect the repository for a declared Node version requirement and confirm
it matches what CI and the Dockerfile actually use, with no other file contradicting it.

**Acceptance Scenarios**:

1. **Given** a developer clones the repository, **When** they check for the required Node
   version, **Then** they find it declared in `package.json` (`engines`) and it matches the
   version used by CI and the Dockerfile.
2. **Given** a Node version manager is used locally, **When** it looks for a version file in the
   repository root, **Then** it finds one that resolves to the same version declared elsewhere.

---

### Edge Cases

- What happens if a direct or transitive dependency (e.g., a native/prebuilt binary such as the
  Prisma engine) is not yet compatible with the new Node.js version? The incompatibility must be
  identified and documented as a required follow-up upgrade, not silently ignored or worked
  around by pinning back to Node 20.
- How does the project signal a version mismatch if someone runs it locally on an older Node
  version? The declared `engines` requirement should make the mismatch discoverable rather than
  failing with an unrelated, confusing error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CI pipeline MUST build, lint, and test the project using the latest Active LTS
  Node.js release instead of Node 20.
- **FR-002**: The production Docker image MUST use the latest Active LTS Node.js release as its
  base image in both the build and runtime stages, instead of Node 20.
- **FR-003**: The project MUST declare its required Node.js version in a single machine-readable
  location (`package.json` `engines` field).
- **FR-004**: The project MUST provide a local version-manager file (e.g., `.nvmrc`) so a
  developer's local environment can be made to match the required version automatically.
- **FR-005**: The full existing automated test suite MUST pass under the new Node.js version
  without any test being altered to change its intended behavior.
- **FR-006**: Any dependency found incompatible with the new Node.js version MUST be identified,
  and the minimum compatible version bump for that dependency MUST be documented.
- **FR-007**: No remaining reference to Node 20 MUST exist in the Dockerfile, CI workflow files,
  `package.json`, or project setup documentation after the upgrade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of CI runs (lint + full test suite) complete successfully on the new Node.js
  version with zero failures caused by the runtime change.
- **SC-002**: The Docker image builds successfully and the application starts and serves requests
  on the new Node.js base image.
- **SC-003**: Zero references to Node 20 remain anywhere in the repository's build, CI, or
  container configuration.
- **SC-004**: A developer following the repository's declared version (via `engines` and the
  version-manager file) ends up running the exact same Node.js major version used by CI and
  production, with no manual lookup required.

## Assumptions

- "Latest Node.js version" means the latest **Active LTS** release at the time of this spec
  (Node.js 24), not the newest odd-numbered/Current release, per the production-stability
  preference confirmed in the Mission Brief.
- No application source code depends on Node 20-specific runtime behavior; this upgrade is
  expected to be a version-bump exercise rather than requiring source-level rewrites.
- Existing major dependency versions (NestJS 10.x, Prisma 5.x, TypeScript 5.x, Jest 29.x) already
  support the target Node.js version; where they don't, a minor/patch bump within the same major
  version is an acceptable part of this upgrade.
- Node 20 is confirmed deprecated/end-of-life as of the current date, which is the motivation for
  this upgrade.
