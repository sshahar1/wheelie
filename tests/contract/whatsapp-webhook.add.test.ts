import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

describe('Contract: POST /webhook/whatsapp (add-performance payload)', () => {
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
      intent: 'add_or_update',
      date: '2026-08-14',
      time: '19:00',
      location: 'Community Center',
      notes: null,
      confidence: 0.95,
    });
  });

  it('accepts and acks a properly signed inbound message from a roster member', async () => {
    await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
    const payload = buildTextMessagePayload(
      '15550001111',
      '@bot we have a show at the community center on August 14th at 7pm',
    );
    const { rawBody, signature } = buildSignedRequest(payload, 'test-app-secret');

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);
  });

  it('rejects a request with an invalid signature', async () => {
    const payload = buildTextMessagePayload('15550001111', '@bot show at 7pm Friday');
    const { rawBody } = buildSignedRequest(payload, 'test-app-secret');

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', 'sha256=deadbeef')
      .send(rawBody)
      .expect(401);
  });

  it('rejects a request with no signature header at all', async () => {
    const payload = buildTextMessagePayload('15550001111', '@bot show at 7pm Friday');
    const { rawBody } = buildSignedRequest(payload, 'test-app-secret');

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .send(rawBody)
      .expect(401);
  });
});
