# Quickstart: Validate the Group Reply Routing Fix

## Prerequisites

- Local dev environment set up per `specs/001-dance-performance-bot/quickstart.md`
  (Postgres running, env vars in place)
- No live Meta credentials needed — all steps below run against the test suite with the
  outbound HTTP call mocked, per contracts/group-reply-routing.md

## 1. Confirm the bug reproduces today (before the fix)

Send a group-shaped payload (with `group_id` set) through the existing add-performance flow
and confirm the outbound mock was called with `to: <from>` instead of `to: <group_id>` —
this is the failing test that should exist before the fix and pass after it.

## 2. Apply the fix

- `whatsapp-webhook-payload.ts`: capture `group_id` onto `InboundMessage`
- `incoming-message.service.ts`: pass `group_id` (if present) as the reply destination instead
  of `message.from`
- `whatsapp-client.service.ts`: when replying to a group, send with
  `recipient_type: "group"` and `to: <group_id>`, per contracts/group-reply-routing.md

## 3. Run the full test suite

```bash
npm test
```

**Expected outcome**: all existing tests still pass unmodified (1:1 fallback path untouched,
per spec FR-004), and the new group-routing tests pass — confirming replies for add, query,
and cancel flows are addressed to the group when `group_id` is present (SC-001, SC-002).

## 4. Manual walkthrough (optional, requires a live Meta group + test number)

1. Add the bot's WhatsApp number to a real (or sandbox) WhatsApp group.
2. Send `@bot we have a show at the community hall next Saturday at 7pm` in the group.
3. Confirm the bot's confirmation reply appears **in the group**, visible to all members —
   not as a private message to you.
4. Ask `@bot when's our next performance?` in the group and confirm the answer also appears
   in the group.
