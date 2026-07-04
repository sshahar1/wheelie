# Phase 0 Research: Upgrade PostgreSQL to Version 18

## Unknown 1: Is Prisma 5.22.x (the currently pinned major version) compatible with PostgreSQL 18?

- **Decision**: Keep the pinned `@prisma/client`/`prisma` version at `^5.22.0` and verify compatibility empirically via the CI run against PostgreSQL 18, rather than pre-emptively upgrading Prisma's major version.
- **Rationale**: PostgreSQL 18 was not yet listed in Prisma's official supported-databases documentation as of research time, but a Prisma maintainer confirmed on the project's GitHub discussions ("PostgreSQL 18 Support," prisma/prisma#28937) that there is "no reason why it would be incompatible," and community testing on Prisma v7.2.0 found no issues. No incompatibility — with any Prisma major version — has been reported. Upgrading Prisma from 5.x to 7.x would itself be a breaking-change-bearing major version bump across two majors, which is out of scope per the Mission Brief constraint that this change require no application/schema changes beyond version bumps needed for PostgreSQL 18 support specifically. Since no such need is evidenced, the current version is retained and validated by CI (FR-004, FR-005).
- **Alternatives considered**: Proactively upgrading to Prisma 6 or 7 "to be safe" — rejected because it would introduce unrelated breaking-change risk (two major version jumps) not required by the evidence, and would violate the spec's scope boundary limiting this change to the version bump itself.
- **Fallback if CI verification fails**: If `prisma migrate deploy` or the test suite fails specifically against PostgreSQL 18, upgrade `prisma`/`@prisma/client` to the minimum version confirmed compatible (Prisma 6+) as a follow-up task, since that would then be evidence of an actual incompatibility rather than a documentation gap.

## Unknown 2: What PostgreSQL 18 image tag should replace `postgres:16-alpine` in CI?

- **Decision**: Use `postgres:18-alpine`, matching the existing floating-major-version, Alpine-variant convention already in use for PostgreSQL 16.
- **Rationale**: The current CI config pins `postgres:16-alpine` (a floating major-version tag, not an exact patch pin). Continuing this convention for 18 keeps the change minimal (single value substitution) and matches the Assumptions section of the spec, which explicitly calls for a floating major-version tag rather than an exact patch pin.
- **Alternatives considered**: Pinning an exact patch version (e.g., `postgres:18.0-alpine`) — rejected as inconsistent with the existing convention and would require manual patch-version bumps over time for no added benefit in a CI-only ephemeral container.

## Unknown 3: Which documentation surfaces name a specific PostgreSQL version and need updating?

- **Decision**: Update `.github/workflows/ci.yml` (the version pin itself) and scan `README.md` and `specs/001-dance-performance-bot/quickstart.md` for any explicit PostgreSQL version mention; `.env.example` requires no change since it contains no version reference.
- **Rationale**: Prior repository research (during `/spec-specify`) found `specs/001-dance-performance-bot/quickstart.md:5` references "a PostgreSQL instance (local Docker container is fine)" without naming a version number, and no other file names a PostgreSQL version outside of CI. If, upon direct inspection during implementation, no explicit version string exists in these docs, no textual change is needed there — only the generic "PostgreSQL" mention stays accurate as-is.
- **Alternatives considered**: Adding an explicit "requires PostgreSQL 18" statement to docs that currently make no version claim — considered but left as an implementation-time judgment call (documentation clarity improvement) rather than a hard requirement, since the spec's FR-003 only requires updating references *where a version is already named*.

**Output**: All unknowns resolved. No NEEDS CLARIFICATION markers remain for Phase 1.
