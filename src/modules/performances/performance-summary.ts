import { Performance } from '@prisma/client';
import { PerformanceSummary } from '../../common/messages/reply-formatter';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTime(time: Date | null): string | null {
  if (!time) {
    return null;
  }
  return time.toISOString().slice(11, 16);
}

export function toPerformanceSummary(performance: Performance): PerformanceSummary {
  return {
    date: formatDate(performance.date),
    time: formatTime(performance.time),
    location: performance.location,
    notes: performance.notes,
  };
}
