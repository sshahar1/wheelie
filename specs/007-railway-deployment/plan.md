# Implementation Plan: Railway Deployment Setup

**Branch**: `007-railway-deployment` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-railway-deployment/spec.md`

## Summary

Deploy the existing NestJS/Prisma/PostgreSQL WhatsApp bot to Railway using a Dockerfile-based
build, matching the pattern from a reference project (`stavbarak/medflow-ai`): `railway.toml`
pins `builder = "DOCKERFILE"` and an `ON_FAILURE` restart policy (10 max retries), the project's
existing `Dockerfile` is modified so its `CMD` runs `prisma migrate deploy` before starting the
app, and the Railway project is connected to GitHub for auto-deploy on merge to `main`. No
application code, schema, or business logic changes are introduced — this is a deployment
configuration feature only.

## Technical Context

**Language/Version**: TypeScript on Node.js `>=24.0.0 <25.0.0` (NestJS 10) — the existing
`Dockerfile` already targets `node:24-alpine`; no runtime version change needed
**Primary Dependencies**: `@nestjs/*` ^10.4.x, `@prisma/client`/`prisma` ^5.22.0 (unchanged);
deploy tooling is Railway itself (Docker-based builder), not a new app dependency
**Storage**: PostgreSQL 18, provisioned as a Railway-managed Postgres service — matches the
`postgres:18-alpine` version already pinned in CI
**Testing**: Existing Jest unit/contract/integration suite (unchanged), plus a new CI job that
builds the production Docker image and boots it against an ephemeral Postgres service to
confirm the migrate-then-start sequence succeeds (closes the Testing Standards gate for this
infra-only change — see Constitution Check and `research.md` §7)
**Target Platform**: Railway (Linux container, Docker-based build via `railway.toml`)
**Project Type**: Single backend service (NestJS API / WhatsApp bot) — Option 1 (single
project) structure, unchanged
**Performance Goals**: Deploy-to-live latency ≤ 10 minutes from merge to `main` (SC-001); no
new runtime performance budget beyond what the existing application already meets
**Constraints**: Zero downtime on a failed deploy (SC-005); migrations MUST complete before the
app accepts traffic (SC-002); restart policy `ON_FAILURE` / max 10 retries, no HTTP
`healthcheckPath` (per Clarifications in spec.md)
**Scale/Scope**: 1 new file (`railway.toml`), 1 modified file (`Dockerfile` — `CMD` only), 1 CI
workflow addition (Docker build/boot smoke test), README + new quickstart doc updates; zero new
Prisma models, fields, or migrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality**: Changes are small and localized (`railway.toml`, one-line `Dockerfile`
  `CMD` edit, one CI job, docs). No new abstractions, no dead code. Standard PR review applies.
  **PASS**.
- **II. Testing Standards (NON-NEGOTIABLE)**: This feature adds no application code paths to
  unit-test, but its "primary behavior" — the Docker image builds and the container's
  migrate-then-start sequence succeeds — MUST still be automatically verified per the
  constitution. Plan adds a CI job (`docker build` + boot against an ephemeral Postgres,
  asserting exit 0 and a successful startup log line) as the automated equivalent of a test for
  this infra behavior, closing the gate before it becomes a violation. **PASS** (contingent on
  that CI job being implemented in tasks/implementation phase).
- **III. User Experience Consistency**: No user-facing behavior changes; the bot's replies and
  interaction patterns are identical to local/CI behavior. README and the new quickstart follow
  the existing documentation conventions from prior specs (002, 005). **PASS**.
- **IV. Performance Requirements**: Performance budget defined above (≤10 minutes deploy
  latency, SC-001). No dedicated benchmark harness exists for deploy latency; Railway's own
  deploy-duration reporting in its dashboard serves as the measured signal, consistent with how
  `005-upgrade-postgres-18` treated CI job duration as its measured signal. **PASS**.

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-railway-deployment/
├── plan.md              # This file
├── research.md           # Phase 0 output
├── data-model.md         # Phase 1 output (no new entities — reference/operational notes only)
├── quickstart.md         # Phase 1 output — production deploy walkthrough
└── tasks.md              # Phase 2 output (/spec-tasks — not created by this command)
```

No `contracts/` directory: this feature adds no new public API, CLI surface, or external
interface. The WhatsApp webhook contract this feature exposes in production is the existing one
already documented in `specs/001-dance-performance-bot/contracts/whatsapp-webhook.md`.

### Source Code (repository root)

```text
# Option 1: Single project (existing structure, unchanged)
railway.toml                            # NEW — Dockerfile builder, ON_FAILURE restart policy
Dockerfile                               # CHANGED — CMD: run `prisma migrate deploy` before start
.github/workflows/ci.yml                 # CHANGED — add Docker build/boot smoke-test job
README.md                                # CHANGED — production deployment section
specs/007-railway-deployment/quickstart.md  # NEW — production deploy walkthrough (this feature)
specs/001-dance-performance-bot/quickstart.md  # unchanged — local dev setup only

src/                                     # unchanged — no application code changes
prisma/                                  # unchanged — no schema/migration changes
```

**Structure Decision**: Existing single-project (Option 1) NestJS layout is unchanged. This
feature only adds root-level deploy configuration (`railway.toml`), a one-line `Dockerfile`
change, a new CI job, and documentation — no new directories or application modules.

## Phase 0: Outline & Research

See [research.md](./research.md). Key resolved unknowns (all already settled during
`/spec-clarify`, plus two implementation-level unknowns resolved here):
- Build strategy: Dockerfile-based (`builder = "DOCKERFILE"`), reusing the existing Dockerfile.
- Migration execution point: inside the Dockerfile `CMD`, not a separate Railway release step.
- Restart/health-check policy: `ON_FAILURE` / 10 retries, no `healthcheckPath`.
- Deploy trigger: GitHub-connected auto-deploy on merge to `main`.
- Node base image: keep `node:24-alpine` (already in place).
- Database provisioning: Railway's managed Postgres service.
- How to satisfy the Testing Standards gate for an infra-only change: a CI Docker build/boot
  smoke test.

**Output**: research.md — all NEEDS CLARIFICATION resolved.

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md).

- **Data model**: No entity, field, or relationship changes. `data-model.md` documents the
  existing `TroupeMember`/`Performance` models as an unchanged reference point and calls out
  production roster seeding as a manual, human-performed operational step (PII-sensitive).
- **Contracts**: Skipped — no public API, CLI, or external interface is added or changed by
  this feature; the production webhook reuses the existing contract from
  `specs/001-dance-performance-bot/contracts/whatsapp-webhook.md`.
- **Agent context update**: No agent-context extension is installed
  (`.specify/extensions.yml` has no `agent-context` entry configured), so this step is skipped
  silently.

**Output**: data-model.md, quickstart.md (no `contracts/` — not applicable)

## Triage Framework: [SYNC] vs [ASYNC] Task Classification

**Execution Strategy**: Config-as-code changes (the files an agent can author and a human can
review via a normal PR diff) are ASYNC. Anything requiring access to a third-party account
Railway/Meta dashboard, real production secrets, or real people's PII is SYNC — an agent
should not handle credentials or personal data, and these actions leave no reviewable diff in
this repository.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 0 | 0 | No new business logic — deployment/config only |
| Data Operations | 0 | 0 | No schema/entity changes; production roster seeding is tracked as an Infrastructure/operational task below |
| UI Components | 0 | 0 | No UI surface |
| Integrations | 1 | 1 | Registering the webhook URL in Meta's dashboard requires the maintainer's Meta developer account (SYNC); the CI Docker build/boot smoke test is a scriptable, reviewable config change (ASYNC) |
| Infrastructure | 3 | 3 | Creating the Railway project, connecting GitHub, provisioning Postgres, entering real production secrets, and seeding the production roster all require the maintainer's own account access or involve PII (SYNC); authoring `railway.toml`, editing the Dockerfile `CMD`, and updating docs are agent-delegatable (ASYNC) |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**
- Creating/configuring the Railway project (GitHub connection, Postgres provisioning) —
  requires the maintainer's own Railway account credentials.
- Entering real production secrets (WhatsApp permanent token, app secret, OpenAI key) into
  Railway's environment variables — security-sensitive; must not pass through an agent.
- Registering the webhook URL with Meta's app dashboard — requires the maintainer's Meta
  developer account.
- Seeding the production `TroupeMember` roster — real people's names/phone numbers (PII).

**Agent-Delegated [ASYNC] Classifications:**
- Authoring `railway.toml` (`builder = "DOCKERFILE"`, restart policy).
- Editing the Dockerfile's `CMD` to run `prisma migrate deploy` before `node dist/main.js`.
- Adding the CI job that builds and boots the Docker image as a smoke test.
- Updating `README.md` and writing `specs/007-railway-deployment/quickstart.md`.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Author `railway.toml` | ASYNC | Mechanical, reviewable config file | Low | Small, declarative file following an explicitly given reference pattern |
| Edit Dockerfile `CMD` | ASYNC | One-line, deterministic, reversible | Low | Same shell-form CMD pattern as the reference project |
| Add CI Docker build/boot smoke test | ASYNC | Deterministic pass/fail signal from CI run | Low | Either the image builds and boots or it doesn't — no judgment call |
| Update README/quickstart docs | ASYNC | Mechanical text addition | Low | Follows existing documentation conventions from prior specs |
| Create Railway project + connect GitHub | SYNC | Requires maintainer's own account access | Medium | No agent credential exists for the maintainer's Railway account |
| Provision Railway Postgres service | SYNC | Requires maintainer's own account access | Medium | Same as above; also establishes the production data store |
| Enter production secrets in Railway | SYNC | Security-sensitive credential handling | High | Real WhatsApp/OpenAI credentials must never pass through an agent or this repo |
| Seed production `TroupeMember` roster | SYNC | PII handling | Medium | Real names/phone numbers; must be entered directly by the maintainer |
| Register webhook URL with Meta | SYNC | Requires maintainer's own account access | Medium | No agent credential exists for the maintainer's Meta developer account |
| Final PR review & merge | SYNC | Human judgment on deploy-config blast radius | Medium | A misconfigured `railway.toml`/Dockerfile could break production deploys; standard human review before merge per Constitution Quality Gates |

## Complexity Tracking

No violations — table intentionally omitted (Constitution Check passed cleanly above).
