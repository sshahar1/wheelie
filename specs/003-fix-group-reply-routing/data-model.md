# Data Model: Fix Group Reply Routing

**N/A** — this feature introduces no new entities, fields, relationships, or state
transitions in the database. `group_id` is captured from each inbound webhook event and
threaded through the existing in-memory request pipeline for the duration of handling that
one message (research.md Decision 3); it is never persisted to `Performance` or
`TroupeMember` (defined in `specs/001-dance-performance-bot/data-model.md`), neither of which
this feature modifies.
