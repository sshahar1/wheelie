import { Injectable, NotFoundException } from '@nestjs/common';
import { TroupeMember } from '@prisma/client';
import { ExtractionService } from '../extraction/extraction.service';
import { GroundedAnswerService } from '../extraction/grounded-answer.service';
import { PerformancesService } from '../performances/performances.service';
import { ReplyFormatter } from '../../common/messages/reply-formatter';
import { MissingFieldsError } from '../performances/missing-fields.error';
import { toPerformanceSummary } from '../performances/performance-summary';

/**
 * Routes an authorized, activation-gated message to the right handler based
 * on ExtractionService's classified intent. Falls back to a graceful
 * "didn't understand" reply for anything unrecognized.
 */
@Injectable()
export class CommandRouterService {
  constructor(
    private readonly extractionService: ExtractionService,
    private readonly performancesService: PerformancesService,
    private readonly groundedAnswerService: GroundedAnswerService,
    private readonly replyFormatter: ReplyFormatter,
  ) {}

  async route(member: TroupeMember, text: string): Promise<string> {
    const referenceDateIso = new Date().toISOString().slice(0, 10);
    const extracted = await this.extractionService.extract(text, referenceDateIso);

    switch (extracted.intent) {
      case 'add_or_update':
        return this.handleAddOrUpdate(member, extracted);
      case 'query_next':
        return this.groundedAnswerService.answerNext();
      case 'query_date':
        return extracted.date
          ? this.groundedAnswerService.answerOnDate(extracted.date)
          : this.fallbackReply();
      case 'query_list':
        return this.groundedAnswerService.answerList();
      case 'cancel':
        return this.handleCancel(member, extracted.date);
      default:
        return this.fallbackReply();
    }
  }

  private async handleCancel(member: TroupeMember, dateIso: string | null): Promise<string> {
    if (!dateIso) {
      return this.replyFormatter.askClarification(['date']);
    }
    try {
      const cancelled = await this.performancesService.cancel(dateIso, member);
      return this.replyFormatter.confirmCancelled(toPerformanceSummary(cancelled));
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.replyFormatter.cancelNotFound();
      }
      throw error;
    }
  }

  private async handleAddOrUpdate(
    member: TroupeMember,
    extracted: { date: string | null; time: string | null; location: string | null; notes: string | null },
  ): Promise<string> {
    try {
      const result = await this.performancesService.addOrUpdate(member, extracted);
      const summary = toPerformanceSummary(result.performance);
      return result.wasUpdate
        ? this.replyFormatter.confirmUpdated(summary)
        : this.replyFormatter.confirmAdded(summary);
    } catch (error) {
      if (error instanceof MissingFieldsError) {
        return this.replyFormatter.askClarification(error.missingFields);
      }
      throw error;
    }
  }

  private fallbackReply(): string {
    return (
      "Sorry, I didn't catch a performance update or question in that — " +
      'try telling me about a show (date + location) or asking "what\'s next?".'
    );
  }
}
