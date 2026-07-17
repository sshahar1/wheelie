# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A WhatsApp bot for a dance troupe's group chat that manages performance dates/locations via
natural-language messages (add, update, query, cancel). NestJS + Prisma + PostgreSQL behind
the Meta WhatsApp Cloud API, with OpenAI used for structured extraction of intent/fields from
free text.

## Commands

```bash
npm install
cp .env.example .env              # fill in real WhatsApp/OpenAI credentials
npx prisma migrate dev            # apply schema migrations (requires local Postgres)
npm run start:dev                 # run with hot reload

npm test                          # full suite: unit, contract, integration (--runInBand)
npm run test:watch
npm run test:cov
npm run lint                      # ESLint over src/ and tests/
npm run format                    # prettier --check src/ and tests/
```

- Tests require a running PostgreSQL instance matching `DATABASE_URL` — contract and
  integration tests share one database and run `--runInBand` (not parallel) for that reason.
- To run a single test file: `npx jest tests/integration/add-performance.test.ts` (jest.config.ts
  defines three projects — `unit`, `contract`, `integration` — matched by directory).
- Local dev also needs a public HTTPS URL (e.g. a tunnel) pointed at `/webhook/whatsapp` for
  Meta's webhook callback.

## Architecture

Message flow: `WhatsAppController` (webhook endpoint) → `SignatureGuard` (HMAC verification of
Meta's `X-Hub-Signature-256`, raw body required) → `IncomingMessageService`, which enforces two
gates in order before anything else runs:
1. **Roster authorization** (`RosterService`) — sender's phone number must be on the roster;
   unrecognized senders are silently ignored, no reply sent.
2. **Activation keyword** (`activation.util.ts`) — message must contain the configured keyword
   (e.g. `@bot`); otherwise it's ordinary chatter and is ignored. The keyword is stripped before
   the remaining text is routed.

Only messages that pass both gates reach `CommandRouterService`, which calls
`ExtractionService` (OpenAI tool-calling against a fixed JSON schema — see
`extraction.service.ts`) to classify intent (`add_or_update` / `cancel` / `query_next` /
`query_date` / `query_list` / `unrecognized`) and extract structured fields, then dispatches to
`PerformancesService` or `GroundedAnswerService` accordingly. All bot copy is centralized in
`ReplyFormatter` (`src/common/messages/`) to keep phrasing consistent across code paths.

Module layout (`src/modules/`):
- `whatsapp/` — inbound webhook, signature verification, activation gating, command routing,
  outbound Meta Cloud API client
- `roster/` — troupe member lookup/authorization (the *only* authorization tier — no separate
  admin role)
- `performances/` — Performance model + add/update/cancel/query logic. `addOrUpdate` matches an
  existing *upcoming* performance by date rather than creating a duplicate; missing required
  fields (date, location) raise `MissingFieldsError`, which the router turns into a
  clarification reply rather than an error
- `extraction/` — OpenAI-backed NL extraction and grounded query-answer phrasing

`src/common/` holds shared config (`app-config.ts` — fails fast via `requireEnv` if a required
env var is missing), the Prisma client wrapper, and `ReplyFormatter`.

## Testing conventions

- `tests/unit/` — pure logic, no app bootstrap.
- `tests/contract/` — HTTP-level webhook contract tests (see `contracts/whatsapp-webhook.md` in
  the relevant spec folder) plus a latency benchmark.
- `tests/integration/` — full request → DB round-trips through a real Nest app instance.
- `tests/support/test-app.ts` builds a real `INestApplication` with only two providers mocked:
  the OpenAI client (`OPENAI_CLIENT`, via `setNextExtraction()` to script the next extraction
  result) and `WhatsAppClientService` (captures sent replies in `sentMessages` instead of
  calling Meta). Everything else — roster, performances, Prisma — runs for real against the
  test database.
- `tests/support/jest.setup.ts` seeds required env vars for tests that don't go through
  `test-app.ts`.

## Spec-driven workflow

This repo uses a spec-kit style workflow: each feature lives under `specs/NNN-slug/` with its
own spec/plan/tasks/quickstart docs (see `specs/001-dance-performance-bot/` for the fullest
example, including `contracts/whatsapp-webhook.md` and `data-model.md`). `.specify/memory/constitution.md`
defines project-wide non-negotiables — notably: zero new lint warnings, tests required for all
new behavior and bug fixes (regression test must fail before fix, pass after), full suite green
before merge, and no coverage decreases. When adding a feature of meaningful size, follow the
specify → plan → tasks → implement progression rather than jumping straight to code.

## Deployment

Deploys to Railway as a Docker container (`railway.toml` + root `Dockerfile`). The container
runs `prisma migrate deploy` before starting the server on every boot and restarts automatically
on failure. Railway auto-deploys on every push/merge to `main` — there is no separate staging
gate, so CI (lint + full test suite + Docker smoke test in `.github/workflows/ci.yml`) is the
only check before production. See `specs/007-railway-deployment/quickstart.md` for the full
production setup (Postgres provisioning, env vars, roster seeding, webhook registration).
