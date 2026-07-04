import { Module } from '@nestjs/common';
import { RosterModule } from '../roster/roster.module';
import { ExtractionModule } from '../extraction/extraction.module';
import { PerformancesModule } from '../performances/performances.module';
import { WhatsAppController } from './whatsapp.controller';
import { SignatureGuard } from './signature.guard';
import { WhatsAppClientService } from './whatsapp-client.service';
import { IncomingMessageService } from './incoming-message.service';
import { CommandRouterService } from './command-router.service';

@Module({
  imports: [RosterModule, ExtractionModule, PerformancesModule],
  controllers: [WhatsAppController],
  providers: [SignatureGuard, WhatsAppClientService, IncomingMessageService, CommandRouterService],
  exports: [CommandRouterService],
})
export class WhatsAppModule {}
