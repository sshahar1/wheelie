# Feature Specification: Fix Group Reply Routing

**Feature Branch**: `[003-fix-group-reply-routing]`

**Created**: 2026-07-04

**Status**: Draft

**Input**: User description: "Spec out the group-reply routing fix — the bot currently replies
privately to whichever individual sent a message instead of replying in the troupe's shared
WhatsApp group, so confirmations, answers, and cancellations are invisible to the rest of the
troupe."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bot Replies Are Visible to the Whole Troupe (Priority: P1)

A troupe member sends a scheduling command or question in the troupe's shared WhatsApp group.
The bot's reply — a confirmation, a clarifying question, a schedule answer, or a cancellation
confirmation — appears in that same group chat, where every troupe member can see it, instead
of being sent privately to only the person who triggered it.

**Why this priority**: This is the core defect. The entire value of the bot depends on the
troupe sharing visibility into schedule changes; if replies are only visible to whoever
happened to send the triggering message, the group never has a shared, trustworthy view of
upcoming performances — the original feature's core promise is broken.

**Independent Test**: Have any troupe member send an add-performance command in the group and
confirm the bot's confirmation appears as a message in that same group chat, visible to every
participant — not as a private one-to-one message to the sender.

**Acceptance Scenarios**:

1. **Given** the bot is active in the troupe's WhatsApp group, **When** an authorized member
   sends a valid add-performance message in the group, **Then** the confirmation reply appears
   in the group chat, visible to all members — not as a private message to the sender.
2. **Given** a member asks a schedule question in the group, **When** the bot answers,
   **Then** the answer appears in the group, not as a private message to the asker.
3. **Given** a member cancels a performance in the group, **When** the bot confirms the
   cancellation, **Then** the confirmation appears in the group.
4. **Given** a member's message is missing required details, **When** the bot asks a
   clarifying question, **Then** the clarifying question appears in the group, so any troupe
   member (not just the original sender) can supply the missing detail.

---

### Edge Cases

- What happens if a message arrives outside of the troupe's group context (e.g., a direct
  one-to-one message sent straight to the bot's number)? The bot should reply directly to that
  sender, since there is no group to reply into — this preserves today's behavior for the
  non-group case rather than breaking it.
- What happens if an inbound group message is missing or has a malformed group identifier?
  The bot must not guess or misroute the reply to the wrong destination; the message should be
  treated the same as an edge case with no actionable destination (logged, not silently
  misdelivered).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST identify which group an inbound message originated from and route
  every reply (confirmation, clarifying question, schedule answer, cancellation confirmation)
  back to that same group.
- **FR-002**: System MUST NOT send a reply to the private chat of the individual sender when
  the triggering message originated in the group.
- **FR-003**: Reply routing MUST be correct regardless of which individual troupe member sent
  the triggering message — the reply destination is the group, not the sender.
- **FR-004**: If a message arrives with no resolvable group context (e.g., a direct one-to-one
  message), system MUST fall back to replying directly to that sender, preserving today's
  behavior for the non-group case.
- **FR-005**: This fix MUST NOT change any other bot behavior — activation-keyword gating,
  roster-based sender authorization, natural-language extraction, query answering, and
  cancellation logic all continue to behave exactly as already specified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of bot replies triggered by a message sent in the troupe's WhatsApp group
  appear in that same group, verified across the add, update, query, and cancel flows.
- **SC-002**: Zero bot replies are misdirected as private one-to-one messages to individual
  senders when the triggering message originated in the group.
- **SC-003**: All previously-specified bot behavior (roster authorization, activation gating,
  extraction accuracy, query answering, cancellation) continues to work with no regressions.

## Assumptions

- The bot operates within a single existing WhatsApp group for the troupe (per the original
  feature's scope) — this fix addresses that single-group case, not multi-group routing.
- The inbound message-delivery channel provides some resolvable identifier for the group a
  message came from, which can be captured and used as the destination for the corresponding
  reply; confirming the exact mechanics of this is planning-phase work, not a specification
  concern.
- No change to roster membership or authorization logic is needed — this fix changes *where*
  a reply is sent, not *whether* one is sent or to whom it's permitted to respond.
