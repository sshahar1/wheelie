# Research: README Logo

## Open Questions

None. The feature spec contains no `[NEEDS CLARIFICATION]` markers — scope, format, and
placement are all fully determined by reasonable defaults documented in the spec's
Assumptions section.

## Decisions

- **Decision**: Reference the logo with a plain relative-path Markdown image
  (`![Wheelie logo](wheelie_logo.png)`), optionally wrapped in an `<img>` tag if a fixed
  pixel width is desired for consistent rendering across renderers.
  **Rationale**: A relative path keeps the README self-contained within the repo and
  works both on GitHub and in local Markdown previews, satisfying FR-003. An `<img
  width="...">` tag is the standard GitHub-flavored Markdown idiom for bounding image
  size (plain `![]()` syntax has no width attribute), satisfying FR-004.
  **Alternatives considered**: Hosting the logo externally (e.g., a CDN) — rejected,
  adds an external dependency for no benefit when the asset is already in the repo.

- **Decision**: Place the logo immediately above the existing `# Dance Troupe
  Performance Bot` H1 title.
  **Rationale**: Matches the common open-source README convention (logo, then title,
  then badges/description) and satisfies "near the top" (FR-002) without needing to
  restructure any existing content.
  **Alternatives considered**: Placing it inline beside the title using an HTML
  table/flex layout — rejected as unnecessary complexity for a single static image.
