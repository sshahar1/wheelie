# Pre-Upgrade Baseline

Captured 2026-07-04, before any dependency version changes (T001).

## `npm audit`

- **23 vulnerabilities**: 3 low, 13 moderate, 7 high, 0 critical
- Key finding: `@nestjs/core <=11.1.17` — GHSA-36xv-jgw5-4q75 (moderate, injection), fix requires `@nestjs/core@11.1.27` (breaking)
- `@nestjs/config` — moderate, via `lodash`, fix requires `@nestjs/config@4.0.4`
- `@nestjs/cli` — high, via `@angular-devkit/*`/`webpack`/`inquirer`, fix requires `@nestjs/cli@11.0.23` (breaking)

## `npm test -- --coverage`

- **Test Suites**: 20 passed, 20 total
- **Tests**: 36 passed, 36 total
- **Time**: 7.058s
- **Coverage (All files)**: 94.43% stmts / 71.23% branch / 92.3% funcs / 93.96% lines
- `tests/contract/webhook-latency.bench.ts` (p95 < 5000ms budget): **PASS**

Per-file coverage detail (for regression comparison in T009):

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| src/app.module.ts | 100 | 100 | 100 | 100 |
| src/common/config/app-config.ts | 83.33 | 33.33 | 100 | 83.33 |
| src/common/config/config.module.ts | 100 | 100 | 100 | 100 |
| src/common/messages/reply-formatter.ts | 95.83 | 71.42 | 100 | 95.23 |
| src/modules/extraction/openai-client.provider.ts | 80 | 100 | 0 | 80 |
| src/modules/performances/performances.repository.ts | 100 | 50 | 100 | 100 |
| src/modules/performances/performances.service.ts | 96.42 | 80 | 100 | 100 |
| src/modules/roster/roster.repository.ts | 87.5 | 100 | 66.66 | 83.33 |
| src/modules/whatsapp/command-router.service.ts | 87.17 | 76.92 | 80 | 86.48 |
| src/modules/whatsapp/whatsapp-client.service.ts | 42.85 | 0 | 0 | 33.33 |
| src/modules/whatsapp/whatsapp-webhook-payload.ts | 100 | 66.66 | 100 | 100 |
| src/modules/whatsapp/whatsapp.controller.ts | 80.95 | 33.33 | 66.66 | 78.94 |
| **All files** | **94.43** | **71.23** | **92.3** | **93.96** |

Post-upgrade validation (T009) must match or exceed these numbers.
