import { Injectable } from '@nestjs/common';
import { Performance } from '@prisma/client';
import { PerformancesRepository } from './performances.repository';
import { parseDateIso } from './date-parsing';

/**
 * Grounded read path for FR-007–009: every answer is sourced from a direct,
 * typed DB query here — never from an LLM's own "knowledge" — so the bot
 * cannot fabricate a performance that isn't actually stored (research.md §5).
 */
@Injectable()
export class PerformancesQueryService {
  constructor(private readonly repository: PerformancesRepository) {}

  findNext(): Promise<Performance | null> {
    return this.repository.findNextUpcoming();
  }

  findOnDate(dateIso: string): Promise<Performance | null> {
    return this.repository.findUpcomingByDate(parseDateIso(dateIso));
  }

  listUpcoming(): Promise<Performance[]> {
    return this.repository.findUpcoming();
  }
}
