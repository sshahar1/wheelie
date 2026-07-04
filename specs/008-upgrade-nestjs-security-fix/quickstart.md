# Quickstart: Verifying the NestJS Security Upgrade

These steps validate that the upgrade satisfies the spec's functional requirements and success criteria.

## 1. Install upgraded dependencies

```bash
npm install
```

Confirms `package-lock.json` resolves `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/testing` to `^11.1.27`+, `@nestjs/config` to `^4.0.4`+, and `@nestjs/cli` to `^11.0.23`+ (FR-002, FR-008, FR-009).

## 2. Confirm the vulnerability is gone

```bash
npm audit
```

Expect zero findings for `@nestjs/core`, `@nestjs/config`, `@nestjs/cli`, and their previously-flagged transitive dependencies (FR-006, SC-001, SC-005).

## 3. Build

```bash
npm run build
```

Must complete without errors (FR-003).

## 4. Run the full automated test suite

```bash
npm test
npm run test:cov
```

All tests must pass — including `tests/contract/webhook-latency.bench.ts`, which enforces the existing 5000ms p95 webhook-ack budget — and coverage must not regress from the pre-upgrade baseline (FR-005, SC-002).

## 5. Start in development and production mode

```bash
npm run start:dev   # verify clean startup, then stop
npm run build && npm run start:prod   # verify clean startup, then stop
```

No new errors or warnings compared to the pre-upgrade baseline (FR-004, SC-003).

## 6. Manual smoke test (non-production environment)

Exercise the bot's core WhatsApp flows (e.g., a representative message that triggers the extraction, roster, and performances modules) against a non-production deployment or local run. Behavior must match the pre-upgrade baseline (SC-004).

## 7. Record migration notes

Document any breaking-change adjustments made during the v10 → v11 migration (see `research.md` R2 for the known candidate areas: Express v5 routing, TypeScript module resolution) in the change's PR description or a migration note (FR-007).
