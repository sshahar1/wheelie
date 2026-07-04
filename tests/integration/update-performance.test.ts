import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { resetDatabase, seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';

describe('User Story 1: update an existing performance', () => {
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

  it('updates the same record instead of creating a duplicate when the location changes', async () => {
    const member = await seedTroupeMember(ctx.prisma, 'Dana', '15550001111');
    await ctx.prisma.performance.create({
      data: {
        date: new Date('2026-08-14T00:00:00.000Z'),
        location: 'Old Hall',
        createdByMemberId: member.id,
        lastUpdatedByMemberId: member.id,
      },
    });

    ctx.setNextExtraction({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: null,
      location: 'New Community Center',
      notes: null,
      confidence: 0.9,
    });

    const payload = buildTextMessagePayload(
      '15550001111',
      "@bot correction — the Aug 14 show moved to the New Community Center",
    );
    const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

    await request(ctx.app.getHttpServer())
      .post('/webhook/whatsapp')
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature-256', signature)
      .send(rawBody)
      .expect(200);

    const stored = await ctx.prisma.performance.findMany();
    expect(stored).toHaveLength(1);
    expect(stored[0].location).toBe('New Community Center');

    expect(ctx.sentMessages).toHaveLength(1);
    expect(ctx.sentMessages[0].body).toContain('Updated');
  });
});
