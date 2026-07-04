# Quickstart: Validate the Node.js LTS Upgrade

## Prerequisites

- Node Version Manager (e.g., `nvm`) installed locally
- Docker installed locally (for the container build check)
- Repository checked out on the `002-upgrade-node-lts` branch

## 1. Local runtime matches the declared version

```bash
nvm install    # reads .nvmrc, installs/uses Node 24
node --version # expect v24.x.x
```

**Expected outcome**: the installed/active Node version matches the `engines.node` range in
`package.json` and the version in `.nvmrc` — no manual lookup required (SC-004).

## 2. Dependencies install and the app builds under Node 24

```bash
npm ci
npx prisma generate
npm run build
```

**Expected outcome**: all three commands complete with exit code 0 and no engine/peer-dependency
warnings related to Node version.

## 3. Full test suite passes under Node 24

```bash
npm run lint
npm test
```

**Expected outcome**: lint reports zero new warnings; the full Jest suite (contract,
integration, unit) passes with no test modified to change its intended behavior (SC-001,
FR-005). This is the compatibility gate for Decision 2 in `research.md` — if `npm test`
fails in a way traceable to Prisma/Node 24 incompatibility, see `research.md` Decision 2 for
the fallback (bump Prisma before anything else).

## 4. Docker image builds and runs on the new base image

```bash
docker build -t dance-performance-bot:node24-check .
docker run --rm -e DATABASE_URL=... -e WHATSAPP_ACCESS_TOKEN=... \
  -e WHATSAPP_PHONE_NUMBER_ID=... -e WHATSAPP_VERIFY_TOKEN=... \
  -e WHATSAPP_APP_SECRET=... -e OPENAI_API_KEY=... \
  -p 3000:3000 dance-performance-bot:node24-check
```

**Expected outcome**: the image builds successfully from a `node:24-alpine` base and the
container starts the NestJS app without crashing (SC-002).

## 5. CI runs green on the new version

Push the branch / open a PR and confirm the `CI` GitHub Actions workflow (`.github/workflows/ci.yml`)
completes successfully using `actions/setup-node` pinned to Node 24 (SC-001, SC-003).

## 6. No stale Node 20 references remain

```bash
grep -rn "node:20\|node-version: 20\|\"node\": \"\\^20" --include="*.yml" --include="*.json" --include="Dockerfile" .
```

**Expected outcome**: no matches outside of historical files (e.g., `specs/001-.../`), confirming
SC-003.
