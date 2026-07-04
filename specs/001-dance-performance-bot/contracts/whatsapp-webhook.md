# Contract: WhatsApp Webhook (Meta Cloud API boundary)

This is the external interface this feature exposes/consumes. The system has no other public
API — the WhatsApp group is the entire user-facing surface, so this webhook is the one contract
boundary requiring explicit documentation and contract tests (per constitution Testing
Standards).

## 1. Webhook verification (inbound, one-time/rotating setup)

**Request**: `GET /webhook/whatsapp`

| Query param | Type | Notes |
|---|---|---|
| `hub.mode` | string | MUST equal `subscribe` |
| `hub.verify_token` | string | MUST match the configured verify token |
| `hub.challenge` | string | Echoed back verbatim on success |

**Response**:
- `200 OK` with body = `hub.challenge` value, when mode and token match.
- `403 Forbidden` when token does not match.

## 2. Inbound message delivery

**Request**: `POST /webhook/whatsapp`

- Header `X-Hub-Signature-256` MUST be present and MUST be validated against the raw request
  body using the app secret before any further processing (research.md §6 / plan Constitution
  Check — security-critical, SYNC-classified).
- Body: Meta's standard WhatsApp Business Account webhook payload
  (`entry[].changes[].value.messages[]`), containing at minimum:
  - `from` (sender WhatsApp ID / phone number) — resolved against TroupeMember.phoneNumber
  - `type` (e.g., `text`)
  - `text.body` (message content)
  - context indicating 1:1 vs. group chat, per Meta's payload shape

**Processing contract** (behavioral, not wire-format):

| Condition | System behavior |
|---|---|
| Signature invalid | Reject with `401`; no further processing |
| Sender not on TroupeMember roster | Acknowledge webhook (`200`) but take no scheduling action (FR-010) |
| Sender on roster, message lacks activation keyword/mention | Acknowledge webhook (`200`); message ignored as a command (research.md §3) |
| Sender on roster, activation present, required fields (date+location) extractable | Create/update/cancel Performance per parsed intent; send confirmation reply (FR-001–006) |
| Sender on roster, activation present, required fields missing/ambiguous | Send clarifying-question reply; no Performance created/updated (FR-004) |
| Sender on roster, activation present, message is a query | Look up stored Performances directly and reply with grounded answer or "none found" (FR-007–009) |

**Response**: `200 OK` (empty body) once the inbound event has been accepted for processing,
regardless of the scheduling outcome above — Meta expects a fast `200` ack; the actual bot
reply is sent asynchronously via the outbound Send Message API below.

## 3. Outbound message send (bot → group)

**Request**: `POST https://graph.facebook.com/{version}/{phone-number-id}/messages` (Meta Cloud
API, called by this system as a client)

- Auth: Bearer token (system access token), configured via environment, never logged.
- Body: Meta's standard outbound text-message payload, addressed to the group/individual the
  inbound message came from.

**Contract test coverage**: request is built with the correct recipient and body for each of
the reply types in the table above (confirmation, clarifying question, query answer, "not
found"), using a mocked HTTP layer — no live call to Meta in tests (research.md §7).
