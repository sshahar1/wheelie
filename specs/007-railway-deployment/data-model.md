# Data Model: Railway Deployment Setup

No entities, fields, relationships, or migrations are added or changed by this feature. The
existing Prisma schema (`TroupeMember`, `Performance`) is unchanged; this feature only changes
*where* and *how* that schema is applied (automatically, via the container's start command, on
a Railway-managed PostgreSQL 18 instance) rather than *what* it contains.

## Existing models (reference only, unchanged)

- **TroupeMember**: name + WhatsApp phone number, used for roster-based authorization. In
  production, this table MUST be seeded before the bot is used (FR-008) — see
  [quickstart.md](./quickstart.md) for the production seeding procedure. No seeding automation
  is introduced by this feature; it remains a manual step, consistent with local development.
- **Performance**: date/location records created via the bot's natural-language commands.
  Unaffected by this feature beyond running on a new hosting environment.

## Operational note: production roster seeding

Seeding `TroupeMember` rows involves real people's names and phone numbers (PII). This MUST be
performed directly by the maintainer against the production database (e.g., via
`railway connect postgres` or Prisma Studio pointed at the production `DATABASE_URL`), not
generated or entered by an automated agent (see Triage Framework in `plan.md`).
