import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('Unrecognized sender is silently ignored (FR-010)', () => {
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

  it('does not reply to or store a performance from a phone number absent from the roster', async () => {
    ctx.setNextExtraction({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: '19:00',
      location: 'Community Center',
      notes: null,
      confidence: 0.95,
    });

    const payload = buildTextMessagePayload(
      '15559990000',
      '@bot we have a show at the community center on August 14th at 7pm',
    );
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(0);
    const stored = await ctx.prisma.performance.findFirst();
    expect(stored).toBeNull();
  });
});
