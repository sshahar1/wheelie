import { Module } from '@nestjs/common';
import { PerformancesRepository } from './performances.repository';
import { PerformancesService } from './performances.service';
import { PerformancesQueryService } from './performances-query.service';

@Module({
  providers: [PerformancesRepository, PerformancesService, PerformancesQueryService],
  exports: [PerformancesRepository, PerformancesService, PerformancesQueryService],
})
export class PerformancesModule {}
