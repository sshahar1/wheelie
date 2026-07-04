/** Minimal shape of Meta's WhatsApp Business Account webhook payload we rely on. */
export interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      value: {
        messages?: Array<{
          from: string;
          group_id?: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}

export interface InboundMessage {
  from: string;
  groupId?: string;
  text: string;
}

export function extractInboundMessages(payload: WhatsAppWebhookPayload): InboundMessage[] {
  const messages: InboundMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value.messages ?? []) {
        if (message.type === 'text' && message.text?.body) {
          messages.push({ from: message.from, groupId: message.group_id, text: message.text.body });
        }
      }
    }
  }
  return messages;
}
