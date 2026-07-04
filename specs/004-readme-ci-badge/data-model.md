# Data Model: README CI Status Badge

No new data entities are introduced by this feature. It surfaces the state of an entity that
already exists outside this codebase:

- **CI Workflow Run** (existing, external): The GitHub Actions execution history for `ci.yml` on
  the `main` branch. This feature does not create, store, or modify this entity — it only
  displays a live pointer (badge image + link) to GitHub's own record of it.

No fields, relationships, validation rules, or state transitions are defined here because none
are owned by this feature.
