# Quickstart: Dance Troupe Performance Bot

## Prerequisites

- Node.js 20 LTS, a PostgreSQL instance (local Docker container is fine)
- A Meta developer app with WhatsApp Cloud API enabled, a test phone number, and:
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_VERIFY_TOKEN` (value you choose, used in the webhook handshake)
  - `WHATSAPP_APP_SECRET` (for signature verification)
- `OPENAI_API_KEY` for structured extraction and grounded Q&A phrasing
- A public HTTPS URL for local development (e.g., a tunneling tool) so Meta can reach
  `/webhook/whatsapp`

## Setup

1. Install dependencies and start PostgreSQL.
2. Copy environment variables above into a local env file.
3. Run Prisma migrations to create the `Performance` and `TroupeMember` tables
   (see `data-model.md`).
4. Seed the `TroupeMember` table with the troupe's roster (name + WhatsApp phone number) —
   roster maintenance is a manual/seed step for this feature, not a bot command.
5. Start the service; point your tunnel's public URL + `/webhook/whatsapp` at Meta's app
   dashboard as the webhook callback URL, using `WHATSAPP_VERIFY_TOKEN` for the handshake.
6. Add the bot's WhatsApp number to the troupe's group.

## Try it

1. In the group, send a message containing the activation keyword/mention plus a performance:
   e.g. `@bot we have a show at the community hall next Saturday at 7pm`.
   Expect a confirmation reply with the parsed date/time/location (User Story 1).
2. Ask: `@bot when's our next performance?` — expect an answer sourced from the record just
   created (User Story 2).
3. Ask about a date with nothing scheduled — expect a clear "none scheduled" reply, not a
   fabricated answer (FR-009).
4. Send: `@bot cancel Saturday's show` — expect a cancellation confirmation, and a follow-up
   "next performance" query should no longer surface it (User Story 3, SC-003).

## Running tests

- `unit`: extraction schema validation, roster authorization, message-formatting helpers.
- `contract`: webhook verification handshake, signature validation, outbound message shape
  (see `contracts/whatsapp-webhook.md`), run against mocked HTTP — no live Meta credentials
  needed in CI.
- `integration`: the four flows above end-to-end against a test database, outbound client
  mocked.
