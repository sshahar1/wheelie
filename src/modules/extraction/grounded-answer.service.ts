import { Injectable } from '@nestjs/common';
import { PerformancesQueryService } from '../performances/performances-query.service';
import { toPerformanceSummary } from '../performances/performance-summary';
import { ReplyFormatter } from '../../common/messages/reply-formatter';

/**
 * Phrases query answers from already-retrieved Performance rows only.
 *
 * research.md §5 considered using the LLM to phrase the retrieved data.
 * We phrase deterministically via ReplyFormatter instead: it's strictly
 * safer against fabrication (no generation step to hallucinate through)
 * and the existing templates already read naturally, so the extra LLM
 * round-trip would add latency/cost without improving grounding.
 */
@Injectable()
export class GroundedAnswerService {
  constructor(
    private readonly queryService: PerformancesQueryService,
    private readonly replyFormatter: ReplyFormatter,
  ) {}

  async answerNext(): Promise<string> {
    const performance = await this.queryService.findNext();
    return this.replyFormatter.answerNextPerformance(
      performance ? toPerformanceSummary(performance) : null,
    );
  }

  async answerOnDate(dateIso: string): Promise<string> {
    const performance = await this.queryService.findOnDate(dateIso);
    return this.replyFormatter.answerDateQuery(
      dateIso,
      performance ? toPerformanceSummary(performance) : null,
    );
  }

  async answerList(): Promise<string> {
    const performances = await this.queryService.listUpcoming();
    return this.replyFormatter.answerUpcomingList(performances.map(toPerformanceSummary));
  }
}
