# Contract Addendum: Group Reply Routing

This corrects/extends §2 and §3 of
`specs/001-dance-performance-bot/contracts/whatsapp-webhook.md` (the "context indicating 1:1
vs. group chat, per Meta's payload shape" note in §2, which the original implementation never
concretely resolved). This document specifies the exact wire shapes; the original contract's
verification/authorization/processing rules are unchanged and not repeated here.

## Inbound (§2 addendum): group discriminator

Each element of `entry[].changes[].value.messages[]` MAY include a `group_id` field:

```json
{
  "from": "<SENDER_PHONE_NUMBER>",
  "group_id": "<GROUP_ID>",
  "id": "<WHATSAPP_MESSAGE_ID>",
  "type": "text",
  "text": { "body": "..." }
}
```

- `group_id` present → the message was sent in the troupe's WhatsApp group. `from` is still
  the individual participant who sent it (used for roster authorization, unchanged) — `from`
  is never the reply destination when `group_id` is present.
- `group_id` absent → the message was sent as a direct 1:1 message to the bot's number.

## Outbound (§3 addendum): reply destination

| Inbound had `group_id`? | Outbound request body |
|---|---|
| Yes | `{ "messaging_product": "whatsapp", "recipient_type": "group", "to": "<group_id>", "type": "text", "text": { "body": "..." } }` |
| No | `{ "messaging_product": "whatsapp", "to": "<from>", "type": "text", "text": { "body": "..." } }` (unchanged from today) |

**Processing contract update**: every row of the behavior table in the base contract's §2
(confirmation, clarifying question, query answer, cancellation confirmation, "not found")
sends its reply per this table — to the group when the triggering message came from the
group, to the sender only as a 1:1 fallback.

**Contract test coverage**: for each reply type, when the triggering inbound message includes
`group_id`, the outbound request MUST be built with `recipient_type: "group"` and
`to: <group_id>` — not `to: <from>`.
