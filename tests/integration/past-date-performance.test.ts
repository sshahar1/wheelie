import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('Performance with an already-passed date (spec Edge Cases)', () => {
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

  it('is still stored, but never surfaces as the next performance or in the upcoming list', async () => {
    const member = await seedTroupeMember(ctx.prisma, 'Dana', '15550003333');
    await ctx.prisma.performance.create({
      data: {
        date: new Date('2020-01-01T00:00:00.000Z'),
        location: 'Old Venue',
        createdByMemberId: member.id,
        lastUpdatedByMemberId: member.id,
      },
    });

    ctx.setNextExtraction({
      intent: 'query_next',
      date: null,
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });

    const payload = buildTextMessagePayload('15550003333', "@bot what's our next performance?");
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    const stillStored = await ctx.prisma.performance.findFirst({ where: { location: 'Old Venue' } });
    expect(stillStored).not.toBeNull();
    expect(stillStored?.status).toBe('upcoming');

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body.toLowerCase()).toContain('no upcoming performance');
  });
});
