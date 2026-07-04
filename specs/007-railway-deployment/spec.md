# Feature Specification: Railway Deployment Setup

**Feature Branch**: `007-railway-deployment`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Railway deployment setup"

## Mission Brief

**Goal**: Deploy the WhatsApp dance troupe bot to Railway with a managed PostgreSQL database, so it runs continuously at a public HTTPS webhook URL that Meta can call, database migrations apply automatically on every deploy, and the troupe can start using it in production.

**Success Criteria**:
- A merge to main results in the bot being live and reachable at its public webhook URL with no manual server steps
- Database schema changes apply automatically on deploy with zero manual migration commands
- The bot responds to real WhatsApp group messages in production at the same reliability observed in local/CI testing

**Constraints**:
- Railway is the chosen hosting platform (already decided)
- Real, permanent Meta WhatsApp credentials and an OpenAI API key must be used in production — not the `"replace-me"` placeholders in `.env.example`
- This is a first deployment, not a migration of an existing live service or existing production data
- `railway.toml` follows the reference project's pattern — Dockerfile-based build (`builder = "DOCKERFILE"`), `restartPolicyType = "ON_FAILURE"` with `restartPolicyMaxRetries = 10`, and migrations run inside the container's start command (`prisma migrate deploy && node dist/main.js`) rather than as a separate Railway-level step

## Clarifications

### Session 2026-07-04

- Q: Should `railway.toml` use Railway's auto-detected Nixpacks build, or a Dockerfile-based build matching the reference project (`stavbarak/medflow-ai`)? → A: Dockerfile-based build (`builder = "DOCKERFILE"`), with `restartPolicyType = "ON_FAILURE"` / `restartPolicyMaxRetries = 10`, and `prisma migrate deploy` run as part of the container's start command rather than a separate Railway deploy step.
- Q: Should Railway auto-deploy on every push/merge to `main`, or should deploys be triggered manually? → A: Auto-deploy — Railway watches the GitHub repo and deploys automatically on every push/merge to `main`.
- Q: Should `railway.toml` define an explicit HTTP `healthcheckPath`, or mirror the reference project exactly (no healthcheck path, restart on process crash only)? → A: Mirror the reference exactly — no `healthcheckPath`; recovery relies solely on `restartPolicyType = "ON_FAILURE"` restarting a crashed process.
- Q: The reference Dockerfile pins Node 20, but this repo already upgraded to Node 24 LTS — should the new Dockerfile use Node 24 or mirror Node 20? → A: Node 24 — the Dockerfile's base image matches this repo's current Node LTS version rather than regressing to the reference's Node 20.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintainer deploys the bot to Railway (Priority: P1)

As a maintainer, I want to deploy the bot to Railway so that it runs continuously with a public HTTPS URL, without needing to manage a server myself.

**Why this priority**: Nothing else in this feature matters until the service actually builds, starts, and stays running on Railway — it's the foundational deliverable everything else depends on.

**Independent Test**: Connect a fresh Railway project to the GitHub repository with the required environment variables configured, push to `main`, and confirm the app builds, starts, and responds over HTTPS with no manual deploy step.

**Acceptance Scenarios**:

1. **Given** a Railway project connected to the GitHub repository with the required environment variables configured, **When** a change is pushed/merged to `main`, **Then** Railway automatically builds and deploys it and the app is reachable over HTTPS with no manual trigger.
2. **Given** a deploy with pending database schema changes, **When** the service starts, **Then** migrations are applied automatically before the app begins accepting traffic.

---

### User Story 2 - Meta reaches the bot via webhook in production (Priority: P2)

As a troupe member, I want the bot to receive and respond to my WhatsApp group messages once it's deployed, so I can actually use it day-to-day instead of only in local testing.

**Why this priority**: The deployment is only useful once Meta can actually deliver messages to it — this is what turns a running service into a usable bot.

**Independent Test**: Register the deployed URL as Meta's webhook callback, send an activation-keyword message in the real group, and confirm a group reply.

**Acceptance Scenarios**:

1. **Given** the deployed public URL registered as Meta's webhook callback with the configured verify token, **When** Meta sends the verification challenge, **Then** the app responds correctly and Meta marks the webhook as verified.
2. **Given** the verified webhook, **When** a troupe member sends an activation-keyword message in the group, **Then** the bot processes it and replies in the group (not privately).

---

### User Story 3 - Service recovers from failures without manual intervention (Priority: P3)

As a maintainer, I want the service to restart automatically if it crashes and a bad deploy to never take down a working version, so the bot doesn't go silent without anyone noticing.

**Why this priority**: Lower priority than getting it live and reachable, but necessary for the bot to stay usable unattended over time rather than requiring the maintainer to babysit it.

**Independent Test**: Force a crash and confirm Railway restarts the service automatically; trigger a failing build and confirm the previous deployment keeps serving traffic.

**Acceptance Scenarios**:

1. **Given** a running deployment, **When** the process crashes, **Then** Railway restarts it automatically per the configured restart policy (no separate HTTP health-check endpoint is used to trigger this).
2. **Given** a deploy with a build or startup failure, **When** the failure occurs, **Then** the previously working deployment continues serving traffic with no downtime.

---

### Edge Cases

- What happens when the database is unreachable at boot (e.g., migrations can't connect)?
- How does the deploy behave if a new Prisma migration fails partway through?
- What happens if Meta's webhook verification request arrives before the app has finished starting up?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST include a `railway.toml` that builds the image from a project Dockerfile (`builder = "DOCKERFILE"`), matching the reference project's pattern rather than relying on Railway's auto-detected Nixpacks build.
- **FR-002**: The Dockerfile MUST use a Node 24 LTS base image, matching the project's current Node runtime version (not the reference project's Node 20 base image).
- **FR-003**: The Dockerfile's container start command MUST run pending database migrations immediately before launching the application (e.g., `prisma migrate deploy && node dist/main.js`), so migrations always apply before the app accepts traffic.
- **FR-004**: The deployed service MUST expose a public HTTPS endpoint reachable at the WhatsApp webhook path for Meta's callbacks.
- **FR-005**: Production environment variables (WhatsApp access token, phone number ID, verify token, app secret, OpenAI API key, database URL) MUST be configured in Railway using real production credentials, not placeholder values.
- **FR-006**: `railway.toml` MUST set `restartPolicyType = "ON_FAILURE"` with `restartPolicyMaxRetries = 10`, matching the reference project's restart policy.
- **FR-007**: A failed deploy MUST NOT take down a previously working deployment.
- **FR-008**: The troupe's roster MUST be seeded in the production database before the bot is used in the group, following the same manual seed step already documented for local setup.
- **FR-009**: The public webhook URL MUST be registered with Meta's WhatsApp app dashboard using the same verify token configured in Railway, so Meta's verification handshake succeeds.
- **FR-010**: The Railway project MUST be connected to the GitHub repository so that every push/merge to `main` triggers an automatic build and deploy, with no manual deploy step required.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A code change merged to main becomes live and reachable at the public webhook URL within 10 minutes, with zero manual server commands.
- **SC-002**: 100% of deploys apply pending database migrations automatically before the app serves traffic, with zero manual migration steps.
- **SC-003**: Meta's webhook verification handshake succeeds on the first attempt against the production URL.
- **SC-004**: A troupe member's message sent in the WhatsApp group receives a bot reply in the group within the same response time observed in local/staging testing.
- **SC-005**: If a deploy fails, the previous version continues serving with zero downtime, every time.

## Assumptions

- Railway is the chosen hosting platform, on at least the paid Hobby plan, since the free trial's one-time credit is time-limited and this service needs to run continuously.
- No custom domain is required for v1 — Railway's provided HTTPS URL is sufficient for Meta's webhook.
- Real production Meta WhatsApp Business credentials (a permanent access token) and an OpenAI API key are available or will be obtained by the maintainer; provisioning those accounts is outside this feature's scope.
- A managed PostgreSQL instance is provisioned via Railway's own Postgres service rather than an external database provider.
- Roster seeding remains a manual step in production, consistent with the existing local-dev quickstart process — no admin UI or bot command for roster management is in scope.
