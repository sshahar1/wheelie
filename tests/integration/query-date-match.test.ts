import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 2: ask about a specific date with a match', () => {
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

  it('answers with the matching performance when one is stored on the queried date', async () => {
    const member = await seedTroupeMember(ctx.prisma, 'Dana', '15550002222');
    await ctx.prisma.performance.create({
      data: {
        date: new Date('2026-09-14T00:00:00.000Z'),
        location: 'Main Theater',
        createdByMemberId: member.id,
        lastUpdatedByMemberId: member.id,
      },
    });

    ctx.setNextExtraction({
      intent: 'query_date',
      date: '2026-09-14',
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });

    const payload = buildTextMessagePayload(
      '15550002222',
      '@bot where are we performing on the 14th?',
    );
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body).toContain('Main Theater');
    expect(ctx.sentMessages[0].body).toContain('2026-09-14');
  });
});
