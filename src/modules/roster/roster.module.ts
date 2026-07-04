import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RosterRepository } from './roster.repository';
import { RosterService } from './roster.service';

@Module({
  imports: [PrismaModule],
  providers: [RosterRepository, RosterService],
  exports: [RosterService],
})
export class RosterModule {}
