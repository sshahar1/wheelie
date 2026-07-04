# Phase 0 Research: Dance Troupe Performance Bot

## 1. Overall backend framework and ORM

**Decision**: NestJS (TypeScript) with Prisma ORM over PostgreSQL.

**Rationale**: The user explicitly asked for "something with a similar base" to the reference
app (stavbarak/medflow-ai), which uses exactly this stack for a structurally similar problem —
a WhatsApp-bot-plus-backend that extracts structured events from natural language and answers
questions grounded in stored data. Reusing the same stack lets patterns (webhook handling,
extraction, grounded Q&A) transfer directly, minimizing net-new architectural risk for a
small, low-traffic feature.

**Alternatives considered**:
- Lightweight Node/Express + raw SQL: less structure for a multi-module domain (performances +
  roster + webhook + extraction); Prisma's migrations/typed client are worth the small extra
  setup cost even at this scale.
- Serverless functions (e.g., single Lambda per webhook event): viable given low traffic, but
  adds deployment/tooling complexity not justified when a single small container is sufficient
  for one troupe's message volume.

## 2. WhatsApp integration channel

**Decision**: Meta WhatsApp Cloud API (official Business Platform), same as the reference app.

**Rationale**: Official, supported integration path for a WhatsApp bot; the reference app
already validates the approach (webhook verification handshake, inbound message payloads,
outbound send-message calls) for a near-identical use case (group + 1:1 messaging, roster
gating).

**Alternatives considered**:
- Unofficial WhatsApp libraries (e.g., browser-automation-based clients): higher risk of
  account bans/ToS violations and brittle to WhatsApp Web changes; rejected for a bot that
  needs to run unattended and reliably.

## 3. Group-message activation pattern

**Decision**: Require an explicit activation keyword (or @mention of the bot) on group
messages before the bot attempts to parse a message as a scheduling command or query;
messages without it are ignored for command purposes (ordinary group chatter passes through
untouched).

**Rationale**: Directly addresses spec Edge Case "how does the bot behave when a message isn't
related to performance scheduling at all." The reference app uses the same pattern (a fixed
Hebrew keyword) specifically to avoid parsing every group message as a command. The exact
keyword/mention text is a configuration value, not a design decision, so it's left
environment-configurable rather than hardcoded.

**Alternatives considered**:
- Parse every message and use LLM intent-classification to decide relevance: higher LLM cost
  and false-positive risk (misclassifying banter as a schedule command); rejected in favor of
  the simpler, more predictable explicit-trigger pattern already proven in the reference app.

## 4. Natural-language date/time and location extraction

**Decision**: Use the OpenAI API with structured output (function/tool calling against a fixed
JSON schema: date, time, location, notes, confidence) rather than free-form completion, so the
extraction step returns machine-checkable structured data every time.

**Rationale**: Spec FR-002–004 require confident, structured extraction with a clarifying
fallback when a required field can't be determined — structured/tool-call output makes "did we
get a date and location" a straightforward presence check on the parsed object, instead of
parsing prose. Matches the reference app's "natural language extraction of appointment details"
capability applied to performances instead of appointments.

**Alternatives considered**:
- Regex/rule-based date parsing (e.g., chrono-node) only: works for well-formed inputs but
  degrades quickly on the loose, conversational phrasing typical of a group chat ("we're doing
  the thing at the usual place next Friday"); rejected as primary approach, though a
  lightweight rule-based pass may still be layered in later as a cheap pre-check — noted as a
  possible optimization, not required for this plan.

## 5. Grounded Q&A for schedule queries

**Decision**: Answer "next performance" / "what's on date X" / "list upcoming" queries by first
querying stored Performance rows directly (deterministic DB query, not an LLM call) and only
using the LLM to phrase the natural-language response from that already-retrieved data.

**Rationale**: Spec FR-007/FR-009 require answers to come only from stored data and to clearly
state "none found" rather than fabricate. Doing the actual lookup in application code (not
delegating retrieval to the LLM) makes grounding structural rather than promptable — the LLM
cannot invent a performance that doesn't exist in the query result it was given. This mirrors
the reference app's "grounded Q&A that answers using only stored data."

**Alternatives considered**:
- Give the LLM full DB read access / RAG-style retrieval over all rows: unnecessary indirection
  for a small, fully-structured dataset with a handful of query shapes; a direct, typed query
  is simpler and easier to test.

## 6. Sender authorization / roster check

**Decision**: Maintain a TroupeMember table keyed by WhatsApp phone number; on every inbound
message, resolve the sender against this table before allowing any add/update/cancel action.
Unrecognized senders' scheduling commands are ignored (per FR-010); a message from an
unrecognized number never mutates data regardless of activation-keyword match.

**Rationale**: Matches the reference app's "family roster validation before accepting
messages," adapted from a household to a troupe roster. Because there's no separate admin tier
in this spec (any recognized member may manage the schedule, per resolved FR-011), the
authorization check only needs to answer "is this sender on the roster," not a finer-grained
permission check.

**Alternatives considered**:
- No roster check (accept commands from anyone in the group): rejected — spec FR-010
  explicitly requires only roster-recognized senders to be able to mutate the schedule.

## 7. Testing approach for the webhook boundary

**Decision**: Contract tests assert Meta Cloud API's webhook verification handshake (GET with
`hub.challenge`) and inbound message payload handling using Meta's documented payload shape,
without calling the real Meta API; the outbound send-message client is tested against a mocked
HTTP layer. Integration tests drive the three user stories end-to-end against a test database
with the outbound client mocked.

**Rationale**: Satisfies constitution Testing Standards (contract tests required for anything
crossing a service boundary) without requiring live Meta credentials or network access in CI.

**Alternatives considered**:
- Recording/replaying real Meta API traffic (VCR-style cassettes): more realistic but adds
  fixture-maintenance overhead not justified for a single, well-documented external API surface.

---

All Technical Context items are resolved above; no `NEEDS CLARIFICATION` markers remain.
