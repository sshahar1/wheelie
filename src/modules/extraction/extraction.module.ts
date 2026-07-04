import { Module } from '@nestjs/common';
import { PerformancesModule } from '../performances/performances.module';
import { openAiClientProvider } from './openai-client.provider';
import { ExtractionService } from './extraction.service';
import { GroundedAnswerService } from './grounded-answer.service';

@Module({
  imports: [PerformancesModule],
  providers: [openAiClientProvider, ExtractionService, GroundedAnswerService],
  exports: [ExtractionService, GroundedAnswerService],
})
export class ExtractionModule {}
