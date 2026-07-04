import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { APP_CONFIG } from '../../common/config/config.module';
import { AppConfig } from '../../common/config/app-config';
import { SignatureGuard } from './signature.guard';
import { IncomingMessageService } from './incoming-message.service';
import { extractInboundMessages, WhatsAppWebhookPayload } from './whatsapp-webhook-payload';

@Controller('webhook/whatsapp')
export class WhatsAppController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly incomingMessageService: IncomingMessageService,
  ) {}

  /** Meta's webhook verification handshake — contracts/whatsapp-webhook.md §1. */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (mode === 'subscribe' && verifyToken === this.config.whatsapp.verifyToken) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  /** Inbound message delivery — contracts/whatsapp-webhook.md §2. */
  @Post()
  @UseGuards(SignatureGuard)
  @HttpCode(200)
  async receive(@Req() request: Request): Promise<void> {
    const payload = request.body as WhatsAppWebhookPayload;
    if (!payload || !Array.isArray(payload.entry)) {
      throw new BadRequestException('Malformed webhook payload');
    }

    const messages = extractInboundMessages(payload);
    for (const message of messages) {
      await this.incomingMessageService.handle(message);
    }
  }
}
