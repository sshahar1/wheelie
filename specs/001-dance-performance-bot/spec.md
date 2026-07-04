# Feature Specification: Dance Troupe Performance Bot

**Feature Branch**: `001-dance-performance-bot`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "I want to create a bot for my dance troupe whatsapp group, to manage dates and locations of our performances. (Inspired by a similar WhatsApp-bot-plus-backend base built for family medical appointment coordination.)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Performance to the Schedule (Priority: P1)

A troupe member posts a message in the group describing an upcoming performance (date,
time, and location) in plain language. The bot recognizes it, extracts the details, stores
it, and confirms back in the group with the structured details so everyone can see it was
recorded correctly.

**Why this priority**: Without a reliable way to get performances into the system, there is
no schedule to query or coordinate around. This is the foundation the rest of the feature
depends on.

**Independent Test**: Can be fully tested by sending a message such as "We have a show at the
community center on August 14th at 7pm" to the group and verifying the bot confirms a stored
performance with the correct date, time, and location — independent of any query feature.

**Acceptance Scenarios**:

1. **Given** the bot is active in the troupe's WhatsApp group, **When** an authorized member
   sends a message describing a new performance's date, time, and location, **Then** the bot
   stores the performance and replies in the group confirming the parsed details.
2. **Given** a message that is ambiguous or missing a required detail (e.g., no location),
   **When** the bot processes it, **Then** the bot replies asking for the missing detail
   instead of guessing or silently storing incomplete data.
3. **Given** a performance already exists for a given date, **When** a member submits an
   update (e.g., a location change) referencing that performance, **Then** the bot updates
   the existing record rather than creating a duplicate, and confirms what changed.

---

### User Story 2 - Ask About Upcoming Performances (Priority: P2)

Any troupe member asks the bot a natural-language question about the schedule — e.g., "when
is our next show?" or "where are we performing on the 14th?" — and receives an accurate
answer drawn only from stored performance data.

**Why this priority**: Once performances are recorded, the most common day-to-day need is
members quickly checking dates and locations without scrolling through group chat history.

**Independent Test**: Can be fully tested by seeding one or more stored performances and
verifying the bot answers date/location questions correctly, independent of the add/update
flow used to create the data.

**Acceptance Scenarios**:

1. **Given** at least one upcoming performance is stored, **When** a member asks "what's our
   next performance?", **Then** the bot replies with that performance's date, time, and
   location.
2. **Given** a member asks about a specific date with no stored performance, **When** the bot
   processes the question, **Then** the bot clearly states none is scheduled rather than
   fabricating an answer.
3. **Given** multiple performances are stored, **When** a member asks for the full upcoming
   schedule, **Then** the bot lists all future performances in chronological order.

---

### User Story 3 - Cancel or Remove a Performance (Priority: P3)

An authorized member notifies the bot that a previously scheduled performance is cancelled or
no longer happening, and the bot removes or marks it so it no longer appears in schedule
queries.

**Why this priority**: Cancellations happen less often than additions and queries, but a
stale schedule (showing a cancelled show as upcoming) actively misleads the troupe, so this
must be supported even if it's the last of the three flows built.

**Independent Test**: Can be fully tested by cancelling a previously seeded performance and
verifying it no longer appears in "upcoming performances" queries, independent of how it was
originally created.

**Acceptance Scenarios**:

1. **Given** a stored upcoming performance, **When** an authorized member tells the bot it's
   cancelled, **Then** the bot marks it cancelled, confirms in the group, and excludes it from
   future schedule queries.
2. **Given** a member attempts to cancel a performance that doesn't exist or has already
   passed, **When** the bot processes the request, **Then** the bot replies that no matching
   upcoming performance was found.

---

### Edge Cases

- What happens when a message contains a date/time that is ambiguous (e.g., "next Friday" sent
  near a month boundary, or a date already in the past)?
- How does the system handle two members submitting conflicting details for the same
  performance around the same time (e.g., different locations)?
- What happens when someone outside the troupe's roster sends a message in the group or a
  non-member somehow messages the bot directly?
- How does the bot behave when a message isn't related to performance scheduling at all (i.e.,
  normal group chatter that shouldn't be parsed as a command)?
- What happens when a performance is added with a date/time that has already passed?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authorized troupe member to add a new performance by
  sending a natural-language message containing at minimum a date and a location.
- **FR-002**: System MUST extract structured performance details (date, time if given,
  location, and any free-text notes) from natural-language messages.
- **FR-003**: System MUST confirm, in the group, the details it stored for each new or updated
  performance so members can catch and correct extraction errors.
- **FR-004**: System MUST ask a clarifying follow-up when a required detail (date or location)
  cannot be confidently determined from a message, rather than storing an incomplete or
  guessed record.
- **FR-005**: System MUST allow updating an existing performance's details (e.g., location or
  time change) without creating a duplicate entry for the same event.
- **FR-006**: System MUST allow an authorized member to cancel/remove a performance, and
  excluded cancelled performances MUST NOT appear in "upcoming" query results.
- **FR-007**: System MUST answer member questions about the next performance and about
  performances on/around a specific date, using only stored performance data.
- **FR-008**: System MUST answer requests for the full list of upcoming performances in
  chronological order.
- **FR-009**: System MUST clearly state when no performance matches a query, rather than
  fabricating a response.
- **FR-010**: System MUST only accept scheduling commands (add/update/cancel) from members
  recognized on the troupe roster; messages from unrecognized senders MUST be ignored for
  scheduling purposes.
- **FR-011**: System MUST allow any recognized troupe member on the roster to add, update, or
  cancel performances — no separate admin/leader role is required for schedule management.
- **FR-012**: System MUST NOT proactively notify the group ahead of upcoming performances;
  the bot only responds when a member sends a message (query-only, no scheduled reminders).
- **FR-013**: System MUST track only the following attributes per performance: date, time (if
  given), location, and optional free-text notes. No additional structured fields (e.g., call
  time, per-show attendance/roster) are required for this scope.

### Key Entities

- **Performance**: A single scheduled show. Attributes: date, time (optional if not yet
  known), location, status (upcoming/cancelled), free-text notes, and a reference to who
  last created/updated it.
- **Troupe Member**: A person recognized as part of the dance troupe for authorization
  purposes. Attributes: name and WhatsApp phone number/identifier. All roster members are
  equally authorized to manage the schedule; no separate admin role exists.
- **WhatsApp Group**: The single group chat the bot monitors and responds within; scoped to
  one troupe per deployment for this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A troupe member can get a new performance recorded and confirmed in under 1
  minute from sending the initial message, without needing a follow-up correction, at least
  90% of the time.
- **SC-002**: Members can get an accurate answer to "when/where is our next performance"
  within seconds of asking, with 100% of answers matching the current stored schedule state.
- **SC-003**: Zero cancelled performances appear in "upcoming performance" responses after
  cancellation is confirmed by the bot.
- **SC-004**: At least 90% of well-formed scheduling messages (containing a clear date and
  location) are correctly parsed and stored without requiring a clarifying follow-up.
- **SC-005**: The troupe stops needing to manually scroll chat history to find "when's our
  next show" — measured by a marked drop in such questions being asked and answered manually
  by a human in the group after adoption.

## Assumptions

- The bot operates within a single existing WhatsApp group for the troupe; multi-group or
  multi-troupe support is out of scope for this feature.
- The troupe roster (who counts as a recognized member/sender) is maintained as a small,
  relatively static list that can be set up once and updated occasionally, similar in spirit
  to a family/household roster in comparable systems.
- Attendance tracking (which specific dancers are performing at, or attending, each show) is
  out of scope for this feature — scope is limited to the performance's date and location (and
  optional free-text notes), per the original request.
- Any recognized troupe member may add, update, or cancel performances; there is no separate
  admin/leader permission tier for schedule management in this scope.
- The bot is query-only with respect to upcoming performances — it does not send proactive
  reminders or notifications ahead of a show; scheduled/push notifications are out of scope.
- The bot requires some form of group activation pattern (e.g., a keyword or mention) to
  distinguish scheduling commands from ordinary group chatter, consistent with how comparable
  group-chat bots avoid responding to every message.
- Standard messaging-app response latency (seconds, not minutes) is expected for both
  confirmations and query answers.
- The language(s) the bot understands and replies in match whatever language(s) the troupe
  group already communicates in; no specific language is mandated by this spec.
