import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 1: add a performance', () => {
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

  it('stores the performance and confirms the parsed details in the group', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
    ctx.setNextExtraction({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: '19:00',
      location: 'Community Center',
      notes: null,
      confidence: 0.95,
    });

    const payload = buildTextMessagePayload(
      '15550001111',
      '@bot we have a show at the community center on August 14th at 7pm',
    );
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    const stored = await ctx.prisma.performance.findFirst();
    expect(stored).not.toBeNull();
    expect(stored?.location).toBe('Community Center');
    expect(stored?.status).toBe('upcoming');

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].to).toBe('15550001111');
    expect(ctx.sentMessages[0].body).toContain('Community Center');
    expect(ctx.sentMessages[0].body).toContain('2026-08-14');
  });
});
