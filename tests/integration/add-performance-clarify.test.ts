import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 1: clarifying question on missing details', () => {
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

  it('asks for the missing location instead of storing an incomplete record', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
    ctx.setNextExtraction({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: null,
      location: null,
      notes: null,
      confidence: 0.4,
    });

    const payload = buildTextMessagePayload('15550001111', '@bot we have a show on August 14th');
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    const stored = await ctx.prisma.performance.findMany();
    expect(stored).toHaveLength(0);

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body.toLowerCase()).toContain('location');
  });
});
