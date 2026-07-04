import { Injectable } from '@nestjs/common';

export interface PerformanceSummary {
  date: string;
  time: string | null;
  location: string;
  notes: string | null;
}

/**
 * Single source of all bot-facing copy so tone/structure stays consistent
 * across every flow (constitution UX Consistency principle).
 */
@Injectable()
export class ReplyFormatter {
  private formatPerformance(p: PerformanceSummary): string {
    const timePart = p.time ? ` at ${p.time}` : '';
    const notesPart = p.notes ? `\nNotes: ${p.notes}` : '';
    return `${p.date}${timePart} @ ${p.location}${notesPart}`;
  }

  confirmAdded(p: PerformanceSummary): string {
    return `Got it! Added a performance:\n${this.formatPerformance(p)}`;
  }

  confirmUpdated(p: PerformanceSummary): string {
    return `Updated the performance:\n${this.formatPerformance(p)}`;
  }

  askClarification(missingFields: string[]): string {
    const fields = missingFields.join(' and ');
    return `I couldn't catch the ${fields} for that performance — can you send those details?`;
  }

  answerNextPerformance(p: PerformanceSummary | null): string {
    if (!p) {
      return "There's no upcoming performance scheduled right now.";
    }
    return `Our next performance:\n${this.formatPerformance(p)}`;
  }

  answerDateQuery(dateLabel: string, p: PerformanceSummary | null): string {
    if (!p) {
      return `No performance is scheduled for ${dateLabel}.`;
    }
    return `On ${dateLabel}:\n${this.formatPerformance(p)}`;
  }

  answerUpcomingList(performances: PerformanceSummary[]): string {
    if (performances.length === 0) {
      return 'No upcoming performances are scheduled right now.';
    }
    const lines = performances.map((p) => `- ${this.formatPerformance(p)}`);
    return `Upcoming performances:\n${lines.join('\n')}`;
  }

  confirmCancelled(p: PerformanceSummary): string {
    return `Cancelled the performance:\n${this.formatPerformance(p)}`;
  }

  cancelNotFound(): string {
    return "I couldn't find a matching upcoming performance to cancel.";
  }
}
