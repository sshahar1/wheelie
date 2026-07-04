import { Module } from '@nestjs/common';
import { ConfigModule } from './common/config/config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { MessagesModule } from './common/messages/messages.module';
import { RosterModule } from './modules/roster/roster.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [ConfigModule, PrismaModule, MessagesModule, RosterModule, WhatsAppModule],
})
export class AppModule {}
