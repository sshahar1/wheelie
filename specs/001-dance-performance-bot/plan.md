# Implementation Plan: Dance Troupe Performance Bot

**Branch**: `001-dance-performance-bot` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-dance-performance-bot/spec.md`

## Summary

A WhatsApp-native bot for a single dance troupe group that lets any recognized member add,
update, query, and cancel upcoming performances (date, time, location, optional notes) using
natural-language messages, and answers schedule questions using only stored data. Technical
approach follows the architecture of the reference app the user cited (a NestJS + Prisma +
PostgreSQL backend behind the Meta WhatsApp Cloud API, with an LLM used for structured
extraction and grounded Q&A), scoped down to a backend-only service — no separate frontend is
needed since all interaction happens inside the WhatsApp group per the approved spec.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20 LTS
**Primary Dependencies**: NestJS (webhook/API framework), Prisma ORM, Meta WhatsApp Cloud API
client (HTTP), OpenAI API (structured extraction + grounded Q&A via function/tool calling)
**Storage**: PostgreSQL (Performance and TroupeMember tables via Prisma)
**Testing**: Jest for unit/service tests, Supertest for webhook contract tests
**Target Platform**: Linux container (e.g., single Docker service), reachable over public HTTPS
for Meta's webhook callbacks
**Project Type**: Single backend service (web-service) — no frontend; the WhatsApp group itself
is the only user interface
**Performance Goals**: Webhook-to-reply latency under 5s p95 (matches spec SC-002 "within
seconds"); comfortably supports a single troupe group (tens of members, a handful of messages
per day) with no meaningful concurrency requirement
**Constraints**: Must expose a publicly reachable HTTPS webhook endpoint for Meta Cloud API
verification and inbound delivery; must verify Meta webhook signatures on every inbound
request; must not answer schedule questions using anything but stored Performance data
(grounded responses only, per spec FR-007/FR-009)
**Scale/Scope**: Single WhatsApp group, single troupe, roster on the order of 10–40 members,
low message volume (no batch/high-throughput concerns)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality**: Satisfied by plan — lint (ESLint) and CI review gates apply as with any
  change; project structure below keeps modules small and avoids speculative abstractions
  (e.g., no generic "roster" framework beyond what the troupe use case needs).
- **II. Testing Standards (NON-NEGOTIABLE)**: Satisfied by plan — contract tests planned for the
  webhook boundary (Meta Cloud API surface), integration tests for the three user stories
  (add/query/cancel), and unit tests for extraction/authorization logic. No merge without a
  green suite, per constitution.
- **III. User Experience Consistency**: Satisfied by plan — all bot replies (confirmations,
  clarifying questions, "not found" answers) will share one message-formatting module so
  tone/structure stays consistent across every flow, avoiding one-off reply strings scattered
  through the codebase.
- **IV. Performance Requirements**: Satisfied by plan — the 5s p95 webhook-to-reply budget above
  is the defined performance budget; a load/benchmark test against the webhook handler is
  planned (see Testing) so this is measured, not assumed.

No violations identified. Complexity Tracking table below is left empty (N/A).

## Project Structure

### Documentation (this feature)

```text
specs/001-dance-performance-bot/
├── plan.md              # This file (/spec-plan command output)
├── research.md          # Phase 0 output (/spec-plan command)
├── data-model.md        # Phase 1 output (/spec-plan command)
├── quickstart.md        # Phase 1 output (/spec-plan command)
├── contracts/           # Phase 1 output (/spec-plan command)
│   └── whatsapp-webhook.md
└── tasks.md             # Phase 2 output (/spec-tasks command - NOT created by /spec-plan)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── performances/        # Performance entity: service, repository, DTOs
│   ├── roster/               # TroupeMember entity: roster lookup/authorization
│   ├── whatsapp/              # Inbound webhook controller + outbound message client
│   └── extraction/            # LLM-backed NL extraction & grounded Q&A
├── common/
│   ├── messages/              # Shared reply-formatting module (UX consistency)
│   └── config/
└── main.ts

prisma/
├── schema.prisma
└── migrations/

tests/
├── contract/                  # Meta webhook request/response contract tests
├── integration/                # End-to-end: add / query / cancel flows
└── unit/                        # extraction parsing, authorization, formatting
```

**Structure Decision**: Single backend project (Option 1 from the template). No frontend
directory is created — per the approved spec, the WhatsApp group is the only surface this
feature exposes, so a "web application" (frontend+backend) split would be unused complexity.

## Triage Framework: [SYNC] vs [ASYNC] Classification

**Execution Strategy**: Hybrid — human review ([SYNC]) for anything security-, correctness-,
or schema-critical; agent delegation ([ASYNC]) for boilerplate and well-specified scaffolding.

### Preliminary Task Classification

| Task Category | Estimated [SYNC] Tasks | Estimated [ASYNC] Tasks | Rationale |
|---------------|----------------------|----------------------|-----------|
| Business Logic | 3 | 2 | Add/cancel/query logic against acceptance scenarios needs human review; list-formatting/sorting helpers are mechanical |
| Data Operations | 1 | 3 | Schema design (Performance/TroupeMember shape) needs human review before it's hard to change; CRUD repo methods and migration files are boilerplate |
| UI Components | 0 | 0 | N/A — no UI in this feature; all interaction is via WhatsApp messages |
| Integrations | 3 | 2 | Webhook signature verification, roster-based authorization, and the extraction prompt/schema are security/correctness-critical; the Meta API HTTP client wrapper and outbound message templating are agent-suitable |
| Infrastructure | 1 | 2 | Secrets/webhook config handling needs human review; Docker and CI scaffolding are agent-suitable |

### Triage Decision Criteria Applied

**High-Risk [SYNC] Classifications:**

- Webhook signature verification and sender-roster authorization — a bypass here lets an
  unauthorized sender mutate the shared schedule (violates FR-010/FR-011 guarantees).
- LLM-based date/location extraction validation logic — bad parsing silently corrupts the
  schedule with no human-in-the-loop confirmation step beyond the bot's own reply (FR-002–004).
- Performance/TroupeMember data model design — foundational schema; costly to change once
  migrations and downstream code depend on it.

**Agent-Delegated [ASYNC] Classifications:**

- Prisma migration file generation from an approved schema.
- CRUD repository/service boilerplate for Performances once the model is fixed.
- Outbound WhatsApp message templates/formatting (once the shared messages module's shape is set).
- Meta Cloud API thin HTTP client wrapper (send-message, mark-as-read).
- Docker/env-var scaffolding and CI pipeline wiring.

### Triage Audit Trail

| Task | Classification | Primary Criteria | Risk Level | Rationale |
|------|----------------|------------------|------------|-----------|
| Design Performance/TroupeMember schema | SYNC | Foundational/hard-to-change | High | Migration churn risk if wrong; downstream code assumes this shape |
| Implement Prisma migrations | ASYNC | Boilerplate from approved schema | Low | Mechanical once schema is reviewed |
| Webhook signature verification | SYNC | Security-critical | High | Auth bypass would let anyone alter the shared schedule |
| Roster-based sender authorization | SYNC | Security-critical | High | Same trust boundary as signature verification |
| NL extraction prompt/schema for date+location | SYNC | Correctness-critical, no review loop | Medium-High | Bad extraction silently stores wrong schedule data |
| Add-performance service logic | SYNC | Core acceptance-scenario logic | Medium | Directly implements FR-001–005 |
| Query/next-performance service logic | SYNC | Core acceptance-scenario logic | Medium | Directly implements FR-007–009 |
| Cancel-performance service logic | ASYNC | Simple state transition once schema fixed | Low | Narrow, well-specified behavior (FR-006) |
| Shared reply-formatting module | ASYNC | UX consistency, well-specified | Low | Mechanical templating once tone/format agreed |
| Meta Cloud API HTTP client wrapper | ASYNC | Thin wrapper over documented external API | Low | No business logic, follows Meta's published contract |
| Webhook contract tests | ASYNC | Mechanical given contract doc | Low | Generated from `contracts/whatsapp-webhook.md` |
| Docker/CI/env scaffolding | ASYNC | Standard infra boilerplate | Low | No feature-specific logic |

## Complexity Tracking

*No Constitution Check violations identified — table intentionally left empty.*
