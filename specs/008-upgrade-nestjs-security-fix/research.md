# Research: Remediate NestJS Core Security Vulnerability

## R1: What is the vulnerability and what fixes it?

- **Decision**: Upgrade `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, and `@nestjs/testing` from `^10.4.15` to `^11.1.27` (or later patch on the 11.x line).
- **Rationale**: `npm audit` identifies `@nestjs/core <=11.1.17` as affected by GHSA-36xv-jgw5-4q75 (moderate, CVSS 6.1, output-neutralization/injection weakness, CWE-74). The advisory's `fixAvailable` points to `@nestjs/core@11.1.27`, and npm reports the fix as `isSemVerMajor: true` — there is no patched release within the 10.x line, so a v10 → v11 major upgrade is the only remediation path.
- **Alternatives considered**:
  - *Patch within v10*: not available — no 10.x release resolves the advisory.
  - *Pin to a resolutions/overrides entry*: rejected — would only mask the audit finding without moving to an actually-patched release, and the transitive peer requirements between `@nestjs/*` packages must match major versions anyway.

## R2: What breaks going from NestJS v10 to v11?

- **Decision**: Treat this as a standard NestJS v10→v11 migration per the official guide, with special attention to Express v5 (the new default HTTP adapter bundled with `@nestjs/platform-express` v11).
- **Rationale** (per NestJS's official migration guide and v11 release notes):
  - Express v5 becomes the default underlying HTTP library in `@nestjs/platform-express@11`. Its router no longer treats a bare `*` as a greedy wildcard — wildcard routes must use a named parameter (e.g., `*path`). A repo scan (`grep` for `@Get`/`@Post`/`@All`/`setGlobalPrefix` with wildcard characters) found **no wildcard routes or RegExp global prefixes** in this codebase, so this change is low-risk here.
  - Global-module middleware execution order changes to always run first, regardless of module graph position — not applicable, this project registers no global middleware today.
  - Dynamic module deduplication now uses object-reference equality instead of generated hashes — not applicable, no dynamic module is imported more than once with different configurations here.
  - `CacheModule` changes (migration to Keyv) — not applicable, this project does not use `@nestjs/cache-manager` or `CacheModule`.
  - Node.js `>=20` is required by NestJS v11 — already satisfied; this project's `engines` field pins Node `>=24.0.0 <25.0.0`.
  - TypeScript module resolution: NestJS v11's lightweight DI container works best with `moduleResolution` set to a modern value (`bundler`/`node16`/`nodenext`) rather than legacy `commonjs`/`node`. This project's `tsconfig.json` currently sets `"module": "commonjs"` without an explicit `moduleResolution` — needs verification during implementation that provider resolution still works correctly after the upgrade (build + full test suite will catch outright breakage).
- **Alternatives considered**: staying on v10 indefinitely and suppressing the audit finding — rejected, it doesn't remediate the vulnerability (violates FR-001).

## R3: `@nestjs/config` vulnerability

- **Decision**: Upgrade `@nestjs/config` from `^3.3.0` to `^4.0.4` (or later on the 4.x line).
- **Rationale**: `npm audit` flags `@nestjs/config` versions `1.1.6 - 4.0.2` for a moderate-severity advisory via a transitive `lodash` dependency; `4.0.4` is the reported fix and is not a semver-major jump in npm's audit metadata terms relative to the installed `3.x`, but it is a major version bump for the package itself (3.x → 4.x). `@nestjs/config@4.x` requires NestJS `^10 || ^11`, so it is compatible with the target `@nestjs/core@11.x`. This project's usage (`ConfigModule.forRoot({ isGlobal: true })` in `src/common/config/config.module.ts`) uses only the module's stable, long-standing API and is not expected to require code changes.
- **Alternatives considered**: leaving `@nestjs/config` on v3 — rejected per stakeholder decision (spec FR-008) to close this vulnerability in the same change since dependencies are already being touched.

## R4: `@nestjs/cli` and dev-tooling vulnerabilities

- **Decision**: Upgrade `@nestjs/cli` from `^10.4.9` to `^11.0.23` (or later on the 11.x line).
- **Rationale**: `npm audit` reports a high-severity finding on `@nestjs/cli` itself plus moderate findings on its transitive dependencies (`@angular-devkit/core`, `@angular-devkit/schematics`, `@angular-devkit/schematics-cli`), all with `fixAvailable` pointing to `@nestjs/cli@11.0.23`. This tool is dev-only (used for `nest build`/`nest start`, not bundled into the production `dist/` output), so the upgrade carries no runtime risk to the deployed bot — only a risk that local build/scaffolding commands behave differently, which the existing `npm run build` and `npm run start:dev` scripts will surface immediately.
- **Alternatives considered**: leaving `@nestjs/cli` on v10 and only accepting the runtime-package fix — rejected per stakeholder decision (spec FR-009) to fully clean the audit report in this same change.

## R5: Testing strategy for the upgrade

- **Decision**: Rely on the existing automated suite (`npm test`, using Jest against `tests/unit`, `tests/integration`, `tests/contract`) plus a manual smoke test of core bot flows in a non-production environment, as already required by spec FR-005 and SC-004.
- **Rationale**: The project's constitution (Testing Standards, NON-NEGOTIABLE) requires the full suite to pass before merge and forbids a coverage decrease. A framework major-version bump is exactly the kind of change where unit tests alone may miss integration-level breakage (e.g., DI resolution order, Express v5 request/response shape differences), so the manual smoke test is retained as a belt-and-suspenders check, consistent with the spec's Assumptions section.
- **Alternatives considered**: automated-tests-only sign-off — rejected as insufficient given this is a production-facing bot and the change touches the framework's core request pipeline.

## Summary of dependency version targets

| Package | Current | Target | Reason |
|---|---|---|---|
| `@nestjs/core` | `^10.4.15` | `^11.1.27` | Fixes GHSA-36xv-jgw5-4q75 |
| `@nestjs/common` | `^10.4.15` | `^11.1.27` | Must match `@nestjs/core` major |
| `@nestjs/platform-express` | `^10.4.15` | `^11.1.27` | Must match `@nestjs/core` major |
| `@nestjs/testing` | `^10.4.15` | `^11.1.27` | Must match `@nestjs/core` major |
| `@nestjs/config` | `^3.3.0` | `^4.0.4` | Fixes lodash-based advisory (FR-008) |
| `@nestjs/cli` | `^10.4.9` | `^11.0.23` | Fixes dev-tooling advisories (FR-009) |

All `[NEEDS CLARIFICATION]` items from the spec are resolved; no open unknowns remain for Phase 1.
