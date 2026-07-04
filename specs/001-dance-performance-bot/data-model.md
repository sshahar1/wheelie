# Phase 1 Data Model: Dance Troupe Performance Bot

Derived from the spec's Key Entities section and resolved clarifications (FR-011–013).

## Performance

Represents a single scheduled show for the troupe.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | yes | Primary key |
| date | Date | yes | Performance date; validation: MUST NOT be required to be in the future at creation time, but "upcoming" queries (FR-007/FR-008) filter to date >= today |
| time | Time (nullable) | no | Optional — spec allows a performance to be recorded before a time is known (FR-013) |
| location | String | yes | Free-text venue/location description |
| notes | Text (nullable) | no | Optional free-text notes (FR-013) |
| status | Enum: `upcoming` \| `cancelled` | yes | Default `upcoming`; set to `cancelled` via User Story 3 flow (FR-006) |
| createdByMemberId | FK → TroupeMember | yes | Who originally added this performance |
| lastUpdatedByMemberId | FK → TroupeMember | yes | Who most recently created/updated/cancelled it |
| createdAt / updatedAt | Timestamp | yes | Standard audit timestamps |

**Validation rules**:
- `date` and `location` MUST both be present before a Performance record is created (FR-001,
  FR-004) — the extraction/service layer holds a message in a "pending clarification" state
  (not persisted as a Performance) until both are resolved.
- Updating an existing Performance (FR-005) MUST match it to an existing record rather than
  inserting a new one; matching strategy: same `date` (± the conversational reference point,
  e.g., "Saturday's show") resolved during extraction, confirmed back to the user per FR-003.
- Cancelling (FR-006) is a status transition (`upcoming` → `cancelled`), not a delete — so a
  cancelled show can still be referenced/audited, but MUST be excluded from any "upcoming"
  query result set (FR-006, SC-003).

**State transitions**:

```text
(created) → upcoming → cancelled
```

No transition back from `cancelled` to `upcoming` is required by the spec; if a cancelled show
is reinstated, it is treated as a new Performance per the update-matching rule above.

## TroupeMember

Represents a person recognized as part of the troupe for authorization purposes.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | yes | Primary key |
| name | String | yes | Display name used in bot confirmations |
| phoneNumber | String | yes, unique | WhatsApp identifier; used to resolve inbound sender → member (FR-010) |
| createdAt | Timestamp | yes | Roster entry creation time |

**Validation rules**:
- `phoneNumber` MUST be unique — one WhatsApp identity maps to exactly one roster entry.
- No role/permission field is modeled: per resolved FR-011, every roster member is equally
  authorized to add/update/cancel performances. Roster membership itself is the only gate.
- Roster maintenance (adding/removing members) is out of scope for this feature's user-facing
  flows per the Assumptions section of the spec — it is expected to be a small, manually
  maintained seed/admin operation, not a bot command.

## Relationships

```text
TroupeMember (1) ──< createdByMemberId ──(*) Performance
TroupeMember (1) ──< lastUpdatedByMemberId ──(*) Performance
```

No other entities are required — per resolved FR-013, attendance/roster-per-show is explicitly
out of scope, so there is no join table between Performance and TroupeMember beyond the
audit-trail foreign keys above.

## Non-persisted concept: WhatsApp Group

The spec's "WhatsApp Group" key entity is represented as configuration (the group's WhatsApp
ID and the activation keyword/mention pattern, per research.md §3), not as a database table —
this feature is explicitly scoped to a single group per deployment (spec Assumptions), so there
is nothing to relate multiple groups to.
