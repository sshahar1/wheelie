# Research: Upgrade Node.js Runtime to Latest LTS

## Decision 1: Target Node.js version

**Decision**: Upgrade to **Node.js 24**, the current Active LTS line.

**Rationale**: Node 20 reached end-of-life (April 2026) and no longer receives security
patches — the trigger for this upgrade. Of the remaining options, Node 22 is already in
Maintenance LTS (EOL 2027-04-30, ~10 months of runway left) while Node 24 is Active LTS
(EOL 2028-04-30), giving the longest support window without adopting an unproven release.
Node 26 is still the Current (non-LTS) line until it promotes to LTS in October 2026, which
per the Mission Brief's production-stability constraint makes it premature for this project.

**Alternatives considered**:
- *Node 22 (Maintenance LTS)* — rejected: already past Active LTS, shorter remaining support
  window than Node 24.
- *Node 26 (Current)* — rejected: not yet LTS, higher risk of undiscovered ecosystem
  incompatibilities; conflicts with the "prefer Active LTS over newest Current" constraint.

Sources: [Node.js — Evolving the Node.js Release Schedule](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule), [Node.js | endoflife.date](https://endoflife.date/nodejs)

## Decision 2: Prisma compatibility with Node 24

**Decision**: Keep `prisma`/`@prisma/client` on the current `5.22.x` line for this upgrade.
Treat "full test suite + `prisma generate`/`migrate deploy` succeed under Node 24 in CI" as
the compatibility gate. Only bump Prisma (first to the newest 5.x patch, and to a new major
only if that's insufficient) if that gate fails.

**Rationale**: Prisma's documented system requirements explicitly list Node 24 support
(`^24.0.0`) starting from Prisma 6/7, and state as general policy that Prisma "supports and
tests all Active LTS and Maintenance LTS Node.js releases." Prisma 5.22 predates the explicit
Node 24 statement, so this is a real, flagged risk per the Mission Brief's constraint
("dependency requiring a bump due to Node incompatibility should be flagged, not silently
upgraded") — but the known open issues about Node 24/25 problems found during research are
scoped to `@prisma/adapter-*` driver adapters (not used by this project, which uses the
default Prisma Client/engine path) or to Node 25 (Current, irrelevant here), not to core
`@prisma/client` usage on Node 24. A major Prisma version bump is out of scope for an
infra-only upgrade unless the compatibility gate proves it necessary.

**Alternatives considered**:
- *Pre-emptively upgrade Prisma to 6.x/7.x alongside the Node upgrade* — rejected: the
  Mission Brief scopes this change as infra-only ("no application behavior changes"); a
  Prisma major bump is a separate, larger change with its own migration guide and should only
  be pulled in if Node 24 compatibility actually requires it.

Sources: [Prisma system requirements](https://www.prisma.io/docs/orm/reference/system-requirements), [Prisma Node 24 discussion](https://www.answeroverflow.com/m/1437538585505955860)

## Decision 3: Version-pinning strategy across Dockerfile / CI / package.json

**Decision**: Pin the exact major version (`24`) in the Dockerfile base image and
`actions/setup-node`, matching the project's existing precise-pin convention (currently
`node:20-alpine` / `node-version: 20`). Add `.nvmrc` containing `24` and an `engines.node`
field in `package.json` (e.g. `>=24.0.0 <25.0.0`) as the single source of truth referenced by
FR-003/FR-004.

**Rationale**: Consistent with how the project already pins Node 20 today — no floating
alias is currently used, so switching to one now would be an unrelated convention change.
Precise pinning also makes drift immediately visible (SC-004) instead of silently following
whatever `lts/*` resolves to on a given day.

**Alternatives considered**:
- *Floating `lts/*` alias in CI/Docker* — rejected: undermines the "single source of truth,
  no drift" success criterion, since the resolved version could change between CI runs
  without a corresponding repository change.

## Decision 4: `@types/node` alignment

**Decision**: Bump the `@types/node` devDependency from `^20.17.9` to `^24.x` to match the
new runtime major.

**Rationale**: Keeps compile-time type signatures aligned with the Node 24 runtime API
surface; leaving it on `^20` risks type-checking against APIs that have since changed or been
removed, giving false confidence.

**Alternatives considered**:
- *Leave `@types/node` at `^20`* — rejected: type/runtime version drift, defeats the purpose
  of the upgrade's "single source of truth" goal.
