# Migration Notes: NestJS v10 → v11 Security Upgrade

## Dependency changes

| Package | Before | After |
|---|---|---|
| `@nestjs/core` | `^10.4.15` | `^11.1.27` |
| `@nestjs/common` | `^10.4.15` | `^11.1.27` |
| `@nestjs/platform-express` | `^10.4.15` | `^11.1.27` |
| `@nestjs/testing` | `^10.4.15` | `^11.1.27` |
| `@nestjs/config` | `^3.3.0` | `^4.0.4` |
| `@nestjs/cli` | `^10.4.9` | `^11.0.23` |

## Code changes required

**None.** The build succeeded and the full test suite passed with zero source changes. A repo-wide scan before the upgrade (`research.md` R2) confirmed this codebase doesn't use any of the areas NestJS's own v10→v11 migration guide flags as breaking:

- No wildcard routes or RegExp `setGlobalPrefix` usage (Express v5's routing change doesn't apply)
- No global-module middleware registration (middleware ordering change doesn't apply)
- No dynamic module imported more than once with different configs (dedup change doesn't apply)
- No `CacheModule`/`@nestjs/cache-manager` usage (Keyv migration doesn't apply)

That prediction held during implementation — `npm run build`, `npm run start:dev`, and `npm run start:prod` all succeeded cleanly against the real Express v5 + NestJS v11 stack, with all routes (`GET`/`POST /webhook/whatsapp`) mapping correctly.

## Verification performed

- `npm audit`: `@nestjs/core`, `@nestjs/config`, and `@nestjs/cli` no longer appear (down from 23 to 4 findings — see Residual finding below)
- `npm run build`: clean
- `npm test -- --coverage`: 20/20 suites, 36/36 tests pass; coverage identical to the pre-upgrade baseline (94.43% stmts) — see `baseline.md`
- `npm run start:dev` / `npm run build && npm run start:prod`: both start cleanly, no new errors/warnings
- Manual smoke test against the compiled production build with real HTTP requests (not just supertest in-process): verified signature validation, unauthorized-sender rejection, and the authorized-sender extraction path all behave correctly; confirmed an unhandled downstream error (simulated via a placeholder OpenAI key) is caught by the default exception filter and returns a generic 500 without crashing the process — unchanged from expected v10 behavior

## Residual finding (not fully resolved by this change)

`@nestjs/platform-express@11.1.27` pins `multer@2.1.1` exactly, which remains vulnerable to two high-severity DoS advisories (GHSA-72gw-mp4g-v24j, GHSA-3p4h-7m6x-2hcm). The fix requires `multer@2.2.0`, which NestJS has not yet adopted in any published release as of this writing — there is no available upgrade path that resolves this today. Risk is assessed as low in practice: this codebase registers no file-upload routes (no `FileInterceptor`/`multer` usage in `src/`), so the vulnerable multipart-parsing code path is never invoked. This should be revisited when NestJS ships a release bumping its pinned `multer` version.

## Pre-existing observations (not introduced by this change)

- One integration test (`add-performance-clarify.test.ts`) showed a single flaky failure during full-suite runs, with a different, non-deterministic HTTP status code each time it occurred (501 once, 503 once) — inconsistent with a real application-level regression. It passed 4/4 times in isolation and the full suite passed cleanly in 3/3 subsequent reruns. Likely a pre-existing test-infrastructure timing sensitivity (DB/connection-pool related), not caused by the NestJS version bump. Worth a separate investigation if it recurs.
- The local Postgres dev container had no docker-compose definition backing it (it was a bare `docker run`), so it was not reproducible from source when it unexpectedly disappeared mid-implementation. Consider adding a `docker-compose.yml` for local dev DB setup as a separate improvement.
