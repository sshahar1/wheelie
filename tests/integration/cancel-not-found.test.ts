import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 3: cancel a non-existent performance', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  it('replies that no matching upcoming performance was found', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550003333');
    ctx.setNextExtraction({
      intent: 'cancel',
      date: '2026-12-25',
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });

    const payload = buildTextMessagePayload('15550003333', '@bot cancel the December 25th show');
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body.toLowerCase()).toContain("couldn't find");
  });
});
