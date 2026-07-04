import { ExtractionService } from '../../src/modules/extraction/extraction.service';

function buildMockOpenAi(response: unknown) {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(response),
      },
    },
  } as never;
}

describe('ExtractionService', () => {
  it('parses a well-formed tool-call response into an ExtractionResult', async () => {
    const mockClient = buildMockOpenAi({
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: 'record_performance_intent',
                  arguments: JSON.stringify({
                    intent: 'add_or_update',
                    date: '2026-08-14',
                    time: '19:00',
                    location: 'Community Center',
                    notes: null,
                    confidence: 0.95,
                  }),
                },
              },
            ],
          },
        },
      ],
    });

    const service = new ExtractionService(mockClient);
    const result = await service.extract('show at the community center Aug 14 at 7pm', '2026-07-01');

    expect(result).toEqual({
      intent: 'add_or_update',
      date: '2026-08-14',
      time: '19:00',
      location: 'Community Center',
      notes: null,
      confidence: 0.95,
    });
  });

  it('falls back to an unrecognized/zero-confidence result when no tool call is returned', async () => {
    const mockClient = buildMockOpenAi({
      choices: [{ message: {} }],
    });

    const service = new ExtractionService(mockClient);
    const result = await service.extract('just some unrelated group chatter', '2026-07-01');

    expect(result).toEqual({
      intent: 'unrecognized',
      date: null,
      time: null,
      location: null,
      notes: null,
      confidence: 0,
    });
  });

  it('falls back to unrecognized when the tool call name does not match', async () => {
    const mockClient = buildMockOpenAi({
      choices: [
        {
          message: {
            tool_calls: [{ function: { name: 'some_other_tool', arguments: '{}' } }],
          },
        },
      ],
    });

    const service = new ExtractionService(mockClient);
    const result = await service.extract('anything', '2026-07-01');

    expect(result.intent).toBe('unrecognized');
    expect(result.confidence).toBe(0);
  });
});
