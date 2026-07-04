import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG } from '../../common/config/config.module';
import { AppConfig } from '../../common/config/app-config';

const GRAPH_API_VERSION = 'v21.0';

/**
 * Thin wrapper over Meta's WhatsApp Cloud API send-message endpoint
 * (contracts/whatsapp-webhook.md §3). No business logic lives here.
 */
@Injectable()
export class WhatsAppClientService {
  private readonly logger = new Logger(WhatsAppClientService.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async sendTextMessage(to: string, body: string, recipientType?: 'group'): Promise<void> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.config.whatsapp.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        ...(recipientType ? { recipient_type: recipientType } : {}),
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Failed to send WhatsApp message: ${response.status} ${errorBody}`);
      throw new Error(`WhatsApp send-message failed with status ${response.status}`);
    }
  }
}
