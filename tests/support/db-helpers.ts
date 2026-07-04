import { PrismaService } from '../../src/common/prisma/prisma.service';

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.performance.deleteMany();
  await prisma.troupeMember.deleteMany();
}

export async function seedTroupeMember(
  prisma: PrismaService,
  name: string,
  phoneNumber: string,
): Promise<{ id: string }> {
  return prisma.troupeMember.create({ data: { name, phoneNumber } });
}
