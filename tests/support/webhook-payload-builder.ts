import { WhatsAppWebhookPayload } from '../../src/modules/whatsapp/whatsapp-webhook-payload';

export function buildTextMessagePayload(from: string, text: string): WhatsAppWebhookPayload {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [{ from, type: 'text', text: { body: text } }],
            },
          },
        ],
      },
    ],
  };
}
