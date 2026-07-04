import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('Contract: POST /webhook/whatsapp (cancel-type payload)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ctx.setNextExtraction({
      intent: 'cancel',
      date: '2026-08-14',
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });
  });

  it('accepts and acks a properly signed cancel message from a roster member', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550003333');
    const payload = buildTextMessagePayload('15550003333', '@bot cancel the August 14th show');
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);
  });
});
