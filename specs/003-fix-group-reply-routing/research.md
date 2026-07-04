# Research: Fix Group Reply Routing

## Decision 1: How to detect that an inbound message came from the group

**Decision**: Treat the presence of a `group_id` field on the inbound message object
(`entry[].changes[].value.messages[].group_id`) as the signal that the message came from the
troupe's group. The `from` field is **not** usable for this — Meta's Cloud API always
populates `from` with the individual participant's phone number, whether the message came
from a group or a 1:1 chat.

**Rationale**: Confirmed directly against Meta's WhatsApp Business Platform Groups API
documentation: inbound group messages carry a `group_id` alongside `from`, and Meta's own docs
state "The `from` field in the `message` object and the contact object point to the same
participant who sends this message" — i.e., `from` identifies the person, never the group.
`group_id` is therefore the only correct discriminator.

**Alternatives considered**:
- *Infer group vs. 1:1 from `messaging_product`/`type` metadata* — rejected: no such
  discriminator exists in Meta's schema; those fields don't vary between 1:1 and group
  delivery.
- *Always treat every message as a group message and require a manually-configured group ID*
  — rejected: breaks the direct-message fallback path (spec Edge Case / FR-004) and hardcodes
  a value that should come from the inbound payload itself.

Source: [Meta for Developers — Group messaging](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups/groups-messaging/)

## Decision 2: How to address a reply to the group

**Decision**: When the triggering inbound message has a `group_id`, send the outbound reply
with `recipient_type: "group"` and `to: <group_id>` (instead of today's `to: <from>` with no
`recipient_type`, which defaults to individual delivery). When there is no `group_id`
(direct 1:1 message), keep today's behavior unchanged: `to: <from>`, no `recipient_type`.

**Rationale**: This is Meta's documented outbound shape for group messages — omitting
`recipient_type: "group"` and sending to a group ID as if it were an individual recipient (or
vice versa) is rejected by Meta's Send Message API. The fallback branch preserves the
already-correct, already-tested 1:1 behavior (spec FR-004) so this fix cannot regress it.

**Alternatives considered**:
- *Always set `recipient_type: "group"`* — rejected: breaks the 1:1 fallback path outright,
  since a bare phone number is not a valid group ID.
- *Look up/cache the group ID separately (e.g., a config value) rather than reading it from
  each inbound message* — rejected: unnecessary indirection given the spec's single-group
  assumption; the inbound message already carries the exact ID to reply to, with no lookup or
  persistence required.

Source: [Meta for Developers — Group messaging](https://developers.facebook.com/documentation/business-messaging/whatsapp/groups/groups-messaging/)

## Decision 3: No persistence or schema changes needed

**Decision**: Thread `group_id` through the existing in-memory request pipeline
(`InboundMessage` → `IncomingMessageService` → `WhatsAppClientService.sendTextMessage`) for
the duration of handling a single webhook event. Do not persist it anywhere.

**Rationale**: Webhook processing for a single inbound message is synchronous, request-scoped
work (per feature 001's plan) — there is no multi-step/async workflow that would require
durable storage of the group ID between receiving the message and sending the reply. Adding a
persisted field would be complexity with no corresponding requirement.

**Alternatives considered**:
- *Store the group ID on `TroupeMember` or a new config table* — rejected: the spec's single-
  group assumption (feature 001 and 003 both) means every inbound group message already
  supplies the one group ID that matters; persisting it doesn't remove any lookup this fix
  actually needs to do.

## Decision 4: Test-fixture and coverage strategy

**Decision**: Extend `tests/support/webhook-payload-builder.ts`'s `buildTextMessagePayload`
with an optional `groupId` parameter (default: undefined, preserving every existing 1:1 test
unchanged). Add new contract-test coverage asserting the outbound request shape
(`recipient_type`/`to`) for a group-sourced message, and new/extended integration tests
re-running the add/query/cancel flows with a group-shaped payload to assert the reply is sent
to the group ID, not the sender.

**Rationale**: The root cause of this bug shipping was that no fixture or test ever modeled a
real group payload — every existing test used a bare 1:1 shape, so 100% test-suite pass gave
false confidence on spec FR-003. Fixing the fixture generator (rather than hand-rolling
payloads per test) keeps this consistent with the existing test-support pattern and makes the
new coverage cheap to extend to future flows.

**Alternatives considered**:
- *Only add one integration test for the add-performance flow* — rejected: spec.md's
  acceptance scenarios explicitly cover add, query, and cancel; the bug is generic to the
  reply path shared by all of them (`IncomingMessageService`), so leaving query/cancel
  unverified would repeat the same class of gap that caused this bug.
