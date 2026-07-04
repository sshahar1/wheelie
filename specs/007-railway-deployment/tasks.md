# Tasks: Railway Deployment Setup

**Input**: Design documents from `/specs/007-railway-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No dedicated unit/integration test tasks are added for application code (none changes). A CI build/boot smoke test is added instead, since it is the automated-verification equivalent for this infra-only change (see plan.md Constitution Check).

**Organization**: Tasks are grouped by user story (US1 = P1 deploy to Railway, US2 = P2 Meta reaches the bot, US3 = P3 failure recovery), preceded by Setup/Foundational config-as-code tasks.

## Format: `[ID] [P?] [SYNC/ASYNC] [Story?] Description`

## Phase 1: Setup (Config-as-Code)

- [x] T001 [P] [ASYNC] Author `railway.toml` at repo root: `builder = "DOCKERFILE"`, `dockerfilePath = "Dockerfile"`, `restartPolicyType = "ON_FAILURE"`, `restartPolicyMaxRetries = 10` (per research.md §1, §3)
- [x] T002 [P] [ASYNC] Edit `Dockerfile`'s final-stage `CMD` from `["node", "dist/main.js"]` to `["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]` (per research.md §2)

**Checkpoint**: Deploy configuration files exist and are internally consistent (no Railway account interaction yet).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Automated verification that the build artifact from Phase 1 actually builds and boots correctly, before any real Railway deploy is attempted. Blocks all user stories — a broken image should never reach Railway.

- [x] T003 [ASYNC] Add a CI job to `.github/workflows/ci.yml` that runs `docker build -t wheelie-smoke .`, then boots the image against an ephemeral `postgres:18-alpine` service container with a throwaway `DATABASE_URL` and placeholder WhatsApp/OpenAI env vars, asserting the container exits 0 for the `prisma migrate deploy` step and logs a successful Nest application startup line before being torn down (per research.md §7; closes the Constitution Testing Standards gate)

**Checkpoint**: CI proves the Dockerfile + railway.toml pairing builds and boots correctly. Safe to proceed to a real Railway deploy.

---

## Phase 3: User Story 1 - Maintainer deploys the bot to Railway (Priority: P1) 🎯 MVP

**Goal**: The bot runs continuously on Railway at a public HTTPS URL, deploying automatically on merge to `main`, with migrations applied automatically.

**Independent Test**: Connect a fresh Railway project to the GitHub repository with the required environment variables configured, push to `main`, and confirm the app builds, starts, and responds over HTTPS with no manual deploy step.

### Implementation for User Story 1

- [ ] T004 [SYNC] [US1] Create a Railway project and connect it to this GitHub repository so pushes/merges to `main` trigger automatic deploys (FR-010) — requires the maintainer's own Railway account
- [ ] T005 [SYNC] [US1] Add a managed Postgres service to the Railway project, which injects `DATABASE_URL` into the app service (research.md §6) (depends on T004)
- [ ] T006 [SYNC] [US1] Configure production environment variables on the app service in Railway with real credentials: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ACTIVATION_KEYWORD`, `OPENAI_API_KEY` (FR-005) — must not use `.env.example` placeholders (depends on T004)
- [ ] T007 [SYNC] [US1] Push/merge to `main` to trigger the first deploy; confirm the build succeeds, `prisma migrate deploy` applies cleanly, the app starts, and the service is reachable over HTTPS at the Railway-provided domain (depends on T001, T002, T003, T004, T005, T006)

**Checkpoint**: The bot is live on Railway and reachable over HTTPS. This is the deployable MVP for this feature (webhook not yet registered with Meta).

---

## Phase 4: User Story 2 - Meta reaches the bot via webhook in production (Priority: P2)

**Goal**: The troupe can message the bot in their WhatsApp group and get real replies in production.

**Independent Test**: Register the deployed URL as Meta's webhook callback, send an activation-keyword message in the real group, and confirm a group reply.

### Implementation for User Story 2

- [ ] T008 [P] [SYNC] [US2] Register the production webhook URL (`https://<railway-domain>/webhook/whatsapp`) and verify token in the Meta app dashboard; confirm Meta's verification handshake succeeds (FR-009) (depends on T007) — requires the maintainer's own Meta developer account
- [ ] T009 [P] [SYNC] [US2] Seed the production `TroupeMember` table with the troupe's roster (name + WhatsApp phone number) via `railway connect postgres` or Prisma Studio against the production `DATABASE_URL` (FR-008, data-model.md) (depends on T007) — involves real people's PII, must be entered directly by the maintainer
- [ ] T010 [SYNC] [US2] Add the bot's WhatsApp number to the troupe's group and send a real activation-keyword message; confirm the bot replies in the group, not privately (depends on T008, T009)

**Checkpoint**: The troupe can use the bot for real in their WhatsApp group.

---

## Phase 5: User Story 3 - Service recovers from failures without manual intervention (Priority: P3)

**Goal**: The service self-heals from crashes and a bad deploy never takes down a working version.

**Independent Test**: Force a crash and confirm Railway restarts the service automatically; trigger a failing build and confirm the previous deployment keeps serving traffic.

### Implementation for User Story 3

- [ ] T011 [SYNC] [US3] Force a process crash (e.g., temporarily set an invalid `DATABASE_URL` on a redeploy, then revert) and confirm Railway restarts the service automatically per `restartPolicyType = "ON_FAILURE"`, with no manual intervention (depends on T007)
- [ ] T012 [SYNC] [US3] Push a commit with a deliberately broken build/startup to a branch/preview and confirm the previously working production deployment continues serving traffic throughout, with zero downtime (SC-005) (depends on T007)

**Checkpoint**: All three user stories are independently verified in production.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T013 [P] [ASYNC] Add a "Deployment" section to `README.md` describing the Railway setup and linking to `specs/007-railway-deployment/quickstart.md`
- [x] T014 [P] [ASYNC] Review `quickstart.md` against the final state of T001–T012 and correct any drift (e.g., exact commands, env var names)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001/T002 can run in parallel immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (T003 builds the image produced by T001/T002) — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion. T004 → T005/T006 → T007.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (needs a live deployed URL, T007). T008 and T009 can run in parallel; T010 depends on both.
- **User Story 3 (Phase 5)**: Depends on User Story 1 (needs a live deployment, T007). Independent of US2.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities

- T001 and T002 (different files: `railway.toml` vs `Dockerfile`).
- T008 and T009 (independent actions: Meta dashboard vs. production database — neither depends on the other).
- T013 and T014 (different files: `README.md` vs `quickstart.md`).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational — CI smoke test).
2. Complete Phase 3 (User Story 1) — the bot is live and reachable over HTTPS.
3. **STOP and VALIDATE**: confirm HTTPS reachability and automatic migrations independently of Meta/webhook concerns.

### Incremental Delivery

1. Setup + Foundational → CI proves the image builds and boots.
2. User Story 1 → bot live on Railway (MVP).
3. User Story 2 → troupe can actually use the bot via WhatsApp.
4. User Story 3 → confidence the service self-heals and bad deploys don't cause downtime.

## Notes

- Every task in Phases 3–5 (T004–T012) is [SYNC]: this feature is dominated by actions that require the maintainer's own Railway/Meta account access, real production secrets, or real troupe PII — none of which an agent should hold or enter (see plan.md Triage Framework).
- Phases 1, 2, and 6 (T001–T003, T013–T014) are [ASYNC]: mechanical, reviewable config/doc changes with no credential or PII exposure.
- Commit T001–T003 as a single reviewable PR before any Railway account work begins.
