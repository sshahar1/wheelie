import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG } from '../../common/config/config.module';
import { AppConfig } from '../../common/config/app-config';
import { RosterService } from '../roster/roster.service';
import { WhatsAppClientService } from './whatsapp-client.service';
import { CommandRouterService } from './command-router.service';
import { hasActivationKeyword, stripActivationKeyword } from './activation.util';
import { InboundMessage } from './whatsapp-webhook-payload';

/**
 * Orchestrates the behavioral contract in contracts/whatsapp-webhook.md:
 * roster authorization gate -> activation-keyword gate -> command routing.
 * Unauthorized senders and non-activated chatter are silently ignored
 * (FR-010; research.md §3) — only recognized, activated messages get a reply.
 */
@Injectable()
export class IncomingMessageService {
  private readonly logger = new Logger(IncomingMessageService.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly rosterService: RosterService,
    private readonly commandRouter: CommandRouterService,
    private readonly whatsAppClient: WhatsAppClientService,
  ) {}

  async handle(message: InboundMessage): Promise<void> {
    const resolution = await this.rosterService.resolveSender(message.from);
    if (!resolution.authorized) {
      this.logger.debug(`Ignoring message from unrecognized sender ${message.from}`);
      return;
    }

    const activationKeyword = this.config.whatsapp.activationKeyword;
    if (!hasActivationKeyword(message.text, activationKeyword)) {
      return;
    }

    const commandText = stripActivationKeyword(message.text, activationKeyword);
    const reply = await this.commandRouter.route(resolution.member, commandText);
    if (message.groupId) {
      await this.whatsAppClient.sendTextMessage(message.groupId, reply, 'group');
    } else {
      await this.whatsAppClient.sendTextMessage(message.from, reply);
    }
  }
}
