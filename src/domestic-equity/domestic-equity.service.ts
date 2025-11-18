import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DomesticEquityService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyDomesticEquity(userId: string, year: number, month: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma casa');
    }

    const household = await this.prisma.household.findUnique({
      where: { id: user.householdId },
      select: {
        id: true,
        members: { select: { id: true } },
      },
    });

    if (!household) throw new NotFoundException('Casa não encontrada');

    const [u1, u2] = household.members;
    if (!u1 || !u2) {
      throw new ForbiddenException('Casa deve ter exatamente dois membros');
    }

    const entries = await this.prisma.domesticTaskEntry.findMany({
      where: {
        householdId: household.id,
        completedAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      select: {
        userId: true,
        hours: true,
        template: { select: { weight: true } },
      },
    });

    const weightMap = {
      LIGHT: 1,
      MEDIUM: 2,
      HEAVY: 3,
    } as const;

    let u1Points = 0;
    let u2Points = 0;

    for (const entry of entries) {
      const basePoints = weightMap[entry.template.weight];
      // Se quiser considerar horas, pode ser basePoints * (hours ?? 1)
      const points = basePoints * (entry.hours ?? 1);
      if (entry.userId === u1.id) u1Points += points;
      else if (entry.userId === u2.id) u2Points += points;
    }

    const totalPoints = u1Points + u2Points || 1;

    return {
      user1Id: u1.id,
      user1Points: u1Points,
      user1Percentage: (u1Points / totalPoints) * 100,
      user2Id: u2.id,
      user2Points: u2Points,
      user2Percentage: (u2Points / totalPoints) * 100,
      totalPoints,
      month,
      year,
    };
  }
}
