# Phase 1 Data Model: Upgrade PostgreSQL to Version 18

No entities, fields, relationships, or state transitions are added, removed, or modified by this feature. The existing Prisma schema (`prisma/schema.prisma`) and migration history (`prisma/migrations/20260703182806_init/`) are unchanged; this section documents them as a reference point for the compatibility verification described in `research.md`.

## Existing Entities (unchanged)

### TroupeMember
Represents a member of the dance troupe. Consumed by `roster.repository.ts` / `roster.service.ts`.

### Performance
Represents a scheduled performance. Consumed by `performances.repository.ts`, `performances.service.ts`, `performances-query.service.ts`, `performance-summary.ts`.

## Verification Scope

The only data-model-relevant activity in this feature is confirming that the SQL emitted by the existing `20260703182806_init` migration — covering the two models above — applies cleanly on a fresh PostgreSQL 18 database (spec FR-002, SC-002). No new migration is authored as part of this feature.
