import { Injectable } from '@nestjs/common';
import { Performance, PerformanceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreatePerformanceInput {
  date: Date;
  time: Date | null;
  location: string;
  notes: string | null;
  memberId: string;
}

export interface UpdatePerformanceInput {
  location?: string;
  time?: Date | null;
  notes?: string | null;
  memberId: string;
}

function startOfToday(): Date {
  return new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
}

@Injectable()
export class PerformancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Matches the update-vs-duplicate rule in data-model.md: same date, still upcoming. */
  findUpcomingByDate(date: Date): Promise<Performance | null> {
    return this.prisma.performance.findFirst({
      where: { date, status: PerformanceStatus.upcoming },
    });
  }

  create(input: CreatePerformanceInput): Promise<Performance> {
    return this.prisma.performance.create({
      data: {
        date: input.date,
        time: input.time,
        location: input.location,
        notes: input.notes,
        createdByMemberId: input.memberId,
        lastUpdatedByMemberId: input.memberId,
      },
    });
  }

  update(id: string, input: UpdatePerformanceInput): Promise<Performance> {
    return this.prisma.performance.update({
      where: { id },
      data: {
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.time !== undefined ? { time: input.time } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        lastUpdatedByMemberId: input.memberId,
      },
    });
  }

  cancel(id: string, memberId: string): Promise<Performance> {
    return this.prisma.performance.update({
      where: { id },
      data: { status: PerformanceStatus.cancelled, lastUpdatedByMemberId: memberId },
    });
  }

  /**
   * "Upcoming" queries additionally require date >= today (edge case: spec.md
   * Edge Cases — a performance added with an already-passed date). Adding one
   * is still allowed (data-model.md has no rejection rule for it), but a
   * past-dated row with status=upcoming must never surface as "next" or in
   * the upcoming list, or SC-002's accuracy guarantee would be violated.
   */
  findUpcoming(): Promise<Performance[]> {
    return this.prisma.performance.findMany({
      where: { status: PerformanceStatus.upcoming, date: { gte: startOfToday() } },
      orderBy: { date: 'asc' },
    });
  }

  findNextUpcoming(): Promise<Performance | null> {
    return this.prisma.performance.findFirst({
      where: { status: PerformanceStatus.upcoming, date: { gte: startOfToday() } },
      orderBy: { date: 'asc' },
    });
  }
}
