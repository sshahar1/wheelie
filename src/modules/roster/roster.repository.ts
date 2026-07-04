import { Injectable } from '@nestjs/common';
import { TroupeMember } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RosterRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByPhoneNumber(phoneNumber: string): Promise<TroupeMember | null> {
    return this.prisma.troupeMember.findUnique({ where: { phoneNumber } });
  }

  create(name: string, phoneNumber: string): Promise<TroupeMember> {
    return this.prisma.troupeMember.create({ data: { name, phoneNumber } });
  }
}
