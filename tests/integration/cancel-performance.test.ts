import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 3: cancel an existing performance', () => {
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
  });

  it('cancels the performance and excludes it from subsequent upcoming queries', async () => {
    const member = await seedTroupeMember(ctx.prisma, 'Dana', '15550003333');
    await ctx.prisma.performance.create({
      data: {
        date: new Date('2026-08-14T00:00:00.000Z'),
        location: 'Community Center',
        createdByMemberId: member.id,
        lastUpdatedByMemberId: member.id,
      },
    });

    ctx.setNextExtraction({
      intent: 'cancel',
      date: '2026-08-14',
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });

    const cancelPayload = buildTextMessagePayload('15550003333', '@bot cancel the August 14th show');
    const cancelSigned = buildSignedRequest(cancelPayload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', cancelSigned.signature)
      .send(cancelSigned.rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body).toContain('Cancelled');

    const stored = await ctx.prisma.performance.findFirst();
    expect(stored?.status).toBe('cancelled');

    // Now confirm it's excluded from an "upcoming" query
    ctx.setNextExtraction({
      intent: 'query_next',
      date: null,
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });
    const queryPayload = buildTextMessagePayload('15550003333', "@bot what's next?");
    const querySigned = buildSignedRequest(queryPayload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', querySigned.signature)
      .send(querySigned.rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(2);
    expect(ctx.sentMessages[1].body.toLowerCase()).toContain('no upcoming performance');
  });

  it('confirms the cancellation in the group, not privately to the sender', async () => {
    const member = await seedTroupeMember(ctx.prisma, 'Dana', '15550003333');
    await ctx.prisma.performance.create({
      data: {
        date: new Date('2026-08-14T00:00:00.000Z'),
        location: 'Community Center',
        createdByMemberId: member.id,
        lastUpdatedByMemberId: member.id,
      },
    });

    ctx.setNextExtraction({
      intent: 'cancel',
      date: '2026-08-14',
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });

    const payload = buildTextMessagePayload(
      '15550003333',
      '@bot cancel the August 14th show',
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
    expect(ctx.sentMessages[0].body).toContain('Cancelled');
  });
});
