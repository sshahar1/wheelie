import { WhatsAppWebhookPayload } from '../../src/modules/whatsapp/whatsapp-webhook-payload';

export function buildTextMessagePayload(
  from: string,
  text: string,
  groupId?: string,
): WhatsAppWebhookPayload {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [{ from, group_id: groupId, type: 'text', text: { body: text } }],
            },
          },
        ],
      },
    ],
  };
}
