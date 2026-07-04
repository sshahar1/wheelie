import request from 'supertest';
import { createTestApp, TestAppContext } from '../support/test-app';
import { seedTroupeMember } from '../support/db-helpers';
import { buildSignedRequest } from '../support/webhook-signing';
import { buildTextMessagePayload } from '../support/webhook-payload-builder';

const APP_SECRET = 'test-app-secret';
const P95_BUDGET_MS = 5000;

/**
 * Measures webhook-to-ack latency against the 5s p95 budget defined in
 * plan.md's Performance Requirements (constitution: performance-sensitive
 * paths must be covered by a benchmark, not assumed). The mocked OpenAI/
 * WhatsApp clients mean this measures our own pipeline overhead, not
 * third-party network latency — which is exactly the budget we control.
 */
describe('Webhook latency benchmark', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await seedTroupeMember(ctx.prisma, 'Dana', '15550009999');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    ctx.setNextExtraction({
      intent: 'query_next',
      date: null,
      time: null,
      location: null,
      notes: null,
      confidence: 0.9,
    });
  });

  it('acks within the p95 latency budget across repeated requests', async () => {
    const ITERATIONS = 20;
    const durationsMs: number[] = [];

    for (let i = 0; i < ITERATIONS; i += 1) {
      const payload = buildTextMessagePayload('15550009999', `@bot what's next? (${i})`);
      const { rawBody, signature } = buildSignedRequest(payload, APP_SECRET);

      const start = process.hrtime.bigint();
      await request(ctx.app.getHttpServer())
        .post('/webhook/whatsapp')
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', signature)
        .send(rawBody)
        .expect(200);
      const end = process.hrtime.bigint();

      durationsMs.push(Number(end - start) / 1_000_000);
    }

    durationsMs.sort((a, b) => a - b);
    const p95Index = Math.ceil(0.95 * durationsMs.length) - 1;
    const p95DurationMs = durationsMs[p95Index];

    expect(p95DurationMs).toBeLessThan(P95_BUDGET_MS);
  });
});
