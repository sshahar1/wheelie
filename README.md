# Dance Troupe Performance Bot

[![CI](https://github.com/sshahar1/wheelie/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/sshahar1/wheelie/actions/workflows/ci.yml)

A WhatsApp bot for a dance troupe's group chat that manages the dates and locations of
upcoming performances — add, update, query, and cancel, all via natural-language messages.
Built on the same architecture as the reference app this was inspired by: NestJS + Prisma +
PostgreSQL behind the Meta WhatsApp Cloud API, with OpenAI used for structured extraction.

See `specs/001-dance-performance-bot/` for the full spec, plan, and task breakdown, and
`specs/001-dance-performance-bot/quickstart.md` for a step-by-step local setup and manual
walkthrough of all three user stories (add, query, cancel).

## Quick setup

```bash
npm install
cp .env.example .env   # fill in real WhatsApp/OpenAI credentials
npx prisma migrate dev
npm run start:dev
```

Requires a running PostgreSQL instance matching `DATABASE_URL`, and a public HTTPS URL (e.g.
a tunnel) pointed at `/webhook/whatsapp` for Meta's webhook callback during local development.

## Scripts

- `npm run start:dev` — run the NestJS app with hot reload
- `npm test` — run the full test suite (unit, contract, integration) against a local Postgres;
  tests run with `--runInBand` since contract/integration tests share one database
- `npm run lint` — ESLint over `src/` and `tests/`
- `npx prisma migrate dev` — apply schema migrations

## Architecture

- `src/modules/whatsapp/` — inbound webhook (signature verification, activation-keyword
  gating), outbound Meta Cloud API client, and command routing
- `src/modules/roster/` — troupe member lookup/authorization
- `src/modules/performances/` — Performance data model, add/update/cancel/query logic
- `src/modules/extraction/` — OpenAI-backed natural-language extraction and grounded
  query-answer phrasing
- `src/common/` — shared config, Prisma client, and the single reply-formatting module that
  keeps all bot copy consistent

See `specs/001-dance-performance-bot/plan.md` for the full technical plan and
`specs/001-dance-performance-bot/data-model.md` for the data model.
