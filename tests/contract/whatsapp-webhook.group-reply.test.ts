import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('Contract: outbound reply destination (contracts/group-reply-routing.md)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    ctx.sentMessages.length = 0;
    ctx.setNextExtraction({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: '19:00',
      location: 'Community Center',
      notes: null,
      confidence: 0.95,
    });
  });

  it('sends the reply to the group_id with recipient_type "group" when the inbound message came from the group', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
    const payload = buildTextMessagePayload(
      '15550001111',
      '@bot we have a show at the community center on August 14th at 7pm',
      '120000000000000000',
    );
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].to).toBe('120000000000000000');
    expect(ctx.sentMessages[0].recipientType).toBe('group');
  });

  it('sends the reply to the sender with no recipient_type when there is no group_id (1:1 fallback)', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
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

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].to).toBe('15550001111');
    expect(ctx.sentMessages[0].recipientType).toBeUndefined();
  });
});
