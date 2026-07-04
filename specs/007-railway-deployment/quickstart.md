# Quickstart: Deploying to Railway

This walks through taking the bot from "tests pass in CI" to "live in the troupe's WhatsApp
group," per the Railway deployment feature.

## Prerequisites

- A Railway account with billing enabled (Hobby plan or above — see project discussion on
  Railway's free trial time limit).
- Real, permanent Meta WhatsApp Cloud API credentials (access token, phone number ID, app
  secret) and an OpenAI API key. Placeholder values from `.env.example` MUST NOT be used in
  production (FR-005).
- Admin access to the Meta developer app dashboard for the troupe's WhatsApp number, to
  register the production webhook URL.

## Steps

1. **Create the Railway project** and connect it to this GitHub repository, so pushes/merges
   to `main` trigger automatic deploys (FR-010).
2. **Add a Postgres service** to the Railway project (Railway's managed Postgres add-on). This
   automatically injects `DATABASE_URL` into the app service's environment.
3. **Set environment variables** on the app service in Railway with real production values:
   `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`,
   `WHATSAPP_APP_SECRET`, `WHATSAPP_ACTIVATION_KEYWORD`, `OPENAI_API_KEY` (FR-005).
4. **Deploy**: push/merge to `main`. Railway builds the Docker image (per `railway.toml`) and
   starts the container, which runs `npx prisma migrate deploy` before starting the app
   (FR-003). Confirm the deploy succeeds and the service is reachable over HTTPS at the
   Railway-provided domain.
5. **Seed the production roster**: connect to the production database (e.g.,
   `railway connect postgres` or Prisma Studio against the production `DATABASE_URL`) and add
   `TroupeMember` rows for each troupe member (name + WhatsApp phone number) — see
   [data-model.md](./data-model.md). This is a manual step performed by the maintainer, not
   automated tooling, since it involves real people's contact information.
6. **Register the webhook with Meta**: in the Meta app dashboard, set the webhook callback URL
   to `https://<railway-domain>/webhook/whatsapp` and the verify token to the same
   `WHATSAPP_VERIFY_TOKEN` configured in Railway (FR-009). Confirm Meta's verification
   handshake succeeds.
7. **Add the bot's WhatsApp number to the troupe's group.**

## Verify

1. Send `@bot we have a show at the community hall next Saturday at 7pm` in the group — expect
   a group reply (not a private message) confirming the parsed performance.
2. Ask `@bot when's our next performance?` — expect an answer sourced from production data.
3. Force a crash (e.g., temporarily set an invalid `DATABASE_URL` and redeploy, then revert) and
   confirm Railway restarts the service automatically per `restartPolicyType = "ON_FAILURE"`,
   without manual intervention.
4. Push an intentionally broken commit to a branch, open it as a deploy preview or observe a
   deliberately failing build, and confirm the previously working production deployment keeps
   serving traffic throughout (SC-005).
