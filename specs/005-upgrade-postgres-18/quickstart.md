# Quickstart: Verifying the PostgreSQL 18 Upgrade

Manual validation steps to confirm the upgrade before merging.

## 1. Verify CI runs against PostgreSQL 18

1. Confirm `.github/workflows/ci.yml` service container image is `postgres:18-alpine`.
2. Push the branch / open the PR and let CI run.
3. Confirm the `npx prisma migrate deploy` step succeeds with no errors (spec FR-002, SC-002).
4. Confirm the full test suite step passes (spec FR-005, SC-003).
5. Compare CI job duration against a recent PostgreSQL-16 run; confirm no more than a 10% increase (Constitution Principle IV budget, see plan.md Technical Context).

## 2. Verify locally (optional, mirrors CI)

```bash
docker run --rm -d --name pg18-check \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dance_performance_bot \
  -p 5432:5432 postgres:18-alpine

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dance_performance_bot"
npx prisma generate
npx prisma migrate deploy
npm test

docker stop pg18-check
```

## 3. Verify documentation references

1. Grep for `postgres` (case-insensitive) across `README.md` and `specs/001-dance-performance-bot/quickstart.md`.
2. Confirm no remaining reference to PostgreSQL 16 or an unspecified/ambiguous version where a version is expected.

## Success

All steps above pass → the upgrade is verified per spec Success Criteria SC-001 through SC-004.
