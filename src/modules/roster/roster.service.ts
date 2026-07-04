import { Injectable } from '@nestjs/common';
import { TroupeMember } from '@prisma/client';
import { RosterRepository } from './roster.repository';

export type SenderResolution =
  | { authorized: true; member: TroupeMember }
  | { authorized: false; member: null };

/**
 * Sole authorization boundary for scheduling commands (spec FR-010/FR-011):
 * only a phone number present on the roster may add/update/cancel a performance.
 * There is no separate admin tier — roster membership is the only gate.
 */
@Injectable()
export class RosterService {
  constructor(private readonly rosterRepository: RosterRepository) {}

  async resolveSender(phoneNumber: string): Promise<SenderResolution> {
    const member = await this.rosterRepository.findByPhoneNumber(phoneNumber);
    if (!member) {
      return { authorized: false, member: null };
    }
    return { authorized: true, member };
  }
}
