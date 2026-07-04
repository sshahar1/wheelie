import { Injectable, NotFoundException } from '@nestjs/common';
import { Performance, TroupeMember } from '@prisma/client';
import { PerformancesRepository } from './performances.repository';
import { MissingFieldsError } from './missing-fields.error';
import { parseDateIso, parseTimeString } from './date-parsing';

export interface AddOrUpdatePerformanceInput {
  date: string | null;
  time: string | null;
  location: string | null;
  notes: string | null;
}

export interface AddOrUpdateResult {
  performance: Performance;
  wasUpdate: boolean;
}

/**
 * Core add/update/cancel logic for FR-001–006: validates required fields,
 * matches an existing upcoming performance by date rather than duplicating
 * it (data-model.md), and applies status transitions.
 */
@Injectable()
export class PerformancesService {
  constructor(private readonly repository: PerformancesRepository) {}

  async addOrUpdate(
    member: TroupeMember,
    input: AddOrUpdatePerformanceInput,
  ): Promise<AddOrUpdateResult> {
    const missingFields: string[] = [];
    if (!input.date) missingFields.push('date');
    if (!input.location) missingFields.push('location');
    if (missingFields.length > 0) {
      throw new MissingFieldsError(missingFields);
    }

    const date = parseDateIso(input.date as string);
    const time = parseTimeString(input.time);
    const existing = await this.repository.findUpcomingByDate(date);

    if (existing) {
      const updated = await this.repository.update(existing.id, {
        location: input.location as string,
        time,
        notes: input.notes,
        memberId: member.id,
      });
      return { performance: updated, wasUpdate: true };
    }

    const created = await this.repository.create({
      date,
      time,
      location: input.location as string,
      notes: input.notes,
      memberId: member.id,
    });
    return { performance: created, wasUpdate: false };
  }

  async cancel(dateIso: string, member: TroupeMember): Promise<Performance> {
    const date = parseDateIso(dateIso);
    const existing = await this.repository.findUpcomingByDate(date);
    if (!existing) {
      throw new NotFoundException('No matching upcoming performance found');
    }
    return this.repository.cancel(existing.id, member.id);
  }
}
