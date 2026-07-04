import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './openai-client.provider';
import { ExtractionResult, PerformanceIntent } from './extraction.types';

const EXTRACT_TOOL_NAME = 'record_performance_intent';

const INTENT_VALUES: PerformanceIntent[] = [
  'add_or_update',
  'cancel',
  'query_next',
  'query_date',
  'query_list',
  'unrecognized',
];

/**
 * Turns a natural-language group message into structured intent + fields
 * using OpenAI tool-calling against a fixed JSON schema (research.md §4),
 * so "did we get a date and location" is a presence check on the parsed
 * object rather than prose parsing.
 */
@Injectable()
export class ExtractionService {
  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

  async extract(text: string, referenceDateIso: string): Promise<ExtractionResult> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You classify a dance troupe group-chat message about performance scheduling. ' +
            `Today's date is ${referenceDateIso} (ISO 8601) — resolve relative dates ` +
            '("next Saturday", "this Friday") against it. Extract only what is explicitly ' +
            'stated or unambiguously implied; leave a field null rather than guessing.',
        },
        { role: 'user', content: text },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: EXTRACT_TOOL_NAME,
            description: 'Record the classified intent and extracted performance fields.',
            parameters: {
              type: 'object',
              properties: {
                intent: { type: 'string', enum: INTENT_VALUES },
                date: { type: ['string', 'null'], description: 'ISO yyyy-mm-dd or null' },
                time: { type: ['string', 'null'], description: '24h HH:mm or null' },
                location: { type: ['string', 'null'] },
                notes: { type: ['string', 'null'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['intent', 'date', 'time', 'location', 'notes', 'confidence'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: EXTRACT_TOOL_NAME } },
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== EXTRACT_TOOL_NAME) {
      return {
        intent: 'unrecognized',
        date: null,
        time: null,
        location: null,
        notes: null,
        confidence: 0,
      };
    }

    const parsed = JSON.parse(toolCall.function.arguments) as ExtractionResult;
    return parsed;
  }
}
