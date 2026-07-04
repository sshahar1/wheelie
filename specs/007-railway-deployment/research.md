# Research: Railway Deployment Setup

## 1. Build strategy: Dockerfile vs. Nixpacks

**Decision**: Use a Dockerfile-based build (`builder = "DOCKERFILE"` in `railway.toml`), reusing and modifying the project's existing root `Dockerfile` rather than letting Railway auto-detect a Nixpacks build.

**Rationale**: Resolved directly in `/spec-clarify` — the user asked for parity with the reference project (`stavbarak/medflow-ai`), whose `railway.toml` pins `builder = "DOCKERFILE"`. The project already has a working multi-stage `Dockerfile` (`node:24-alpine`, build + production stages), so no new build definition is needed — only its `CMD` changes.

**Alternatives considered**: Nixpacks (Railway's zero-config default) — rejected because it would diverge from the explicitly requested reference pattern and would require Railway to re-derive a build plan Nixpacks doesn't already have tuned for this repo, when a working Dockerfile already exists.

## 2. Running migrations before the app starts

**Decision**: Change the existing Dockerfile's `CMD` from `["node", "dist/main.js"]` to a shell form that runs `npx prisma migrate deploy` first: `CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]`.

**Rationale**: Matches the reference project's pattern and satisfies FR-003/SC-002 (migrations must apply before the app accepts traffic) without adding a separate Railway-level release step. `prisma migrate deploy` is idempotent — re-running it on a deploy with no pending migrations is a no-op, so this is safe on every deploy including ones with no schema change.

**Alternatives considered**: A Railway `[deploy].preDeployCommand` (if supported) — rejected to keep the migration step colocated with the app's own startup sequence (matches reference, keeps the Dockerfile self-contained and testable outside Railway too, e.g., locally with `docker run`).

## 3. Restart policy and health checks

**Decision**: `railway.toml` sets `restartPolicyType = "ON_FAILURE"` and `restartPolicyMaxRetries = 10`. No `healthcheckPath` is configured.

**Rationale**: Resolved in `/spec-clarify` — mirrors the reference project exactly. The app has no existing `/health` endpoint, so adding a `healthcheckPath` would require new application code out of scope for a deployment-config feature. Process-crash restart (`ON_FAILURE`) is sufficient for this bot's low-traffic, single-process profile.

**Alternatives considered**: Adding a dedicated health endpoint + `healthcheckPath` — deferred as a future enhancement, not required to meet this feature's success criteria.

## 4. Continuous deployment trigger

**Decision**: Connect the Railway project directly to the GitHub repository so every push/merge to `main` triggers an automatic build and deploy (FR-010).

**Rationale**: Resolved in `/spec-clarify` — SC-001 ("a merge to main becomes live... within 10 minutes") presupposes continuous deployment; a manual trigger would leave a gap between merge and live that contradicts the stated success criterion.

**Alternatives considered**: Manual `railway up` from the CLI per release — rejected as extra manual toil with no offsetting benefit for a single-maintainer project.

## 5. Node.js base image version

**Decision**: Keep the Dockerfile's existing `node:24-alpine` base image (already the case — no change needed here beyond the `CMD` edit).

**Rationale**: Resolved in `/spec-clarify` — the reference project's Dockerfile pins Node 20, but this repo already completed a Node 24 LTS upgrade (`specs/002-upgrade-node-lts/`); regressing to Node 20 to match the reference would contradict a settled, more recent decision. "Similar to the reference" was scoped to the deploy *pattern* (builder type, migrate-then-start, restart policy), not its base image version.

**Alternatives considered**: `node:24-bookworm-slim` (matching the reference's Debian-based flavor instead of Alpine) — rejected; the existing Dockerfile already uses `alpine` successfully (smaller image, already installs `openssl` for Prisma's needs), and switching base image flavor is an unrelated, unrequested change.

## 6. Database provisioning

**Decision**: Provision PostgreSQL via Railway's own managed Postgres service (a Railway "plugin"/add-on within the same project), which automatically injects a `DATABASE_URL` environment variable.

**Rationale**: Simplest path with the least new surface area — Railway's managed Postgres matches the version already used in CI (`postgres:18-alpine`) and requires no separate database host or credentials management outside Railway's own environment variable injection.

**Alternatives considered**: An external managed Postgres provider (e.g., Supabase, Neon) — rejected; adds a second vendor relationship and manual `DATABASE_URL` wiring with no benefit for this project's scale.

## 7. Closing the automated-testing gate for an infra-only change

**Decision**: Add a CI job that runs `docker build` against the (modified) Dockerfile and then boots the resulting image against an ephemeral Postgres service container, asserting the container's process exits 0 for `prisma migrate deploy` and the Nest app logs a successful startup line, before the change can merge.

**Rationale**: The project constitution's Testing Standards principle is non-negotiable and requires automated coverage of a change's primary behavior. Since this feature's "primary behavior" is the build-and-boot sequence itself (not application logic), a Docker build-and-boot smoke test in CI is the automated equivalent of a unit test for this change, avoiding a Constitution Check violation (see `plan.md`).

**Alternatives considered**: Relying solely on manual verification after each Railway deploy — rejected as it does not satisfy "automated tests covering primary behavior" and would regress to manual spot-checks the constitution explicitly disfavors (see Principle IV rationale, applied here by analogy to Principle II).
