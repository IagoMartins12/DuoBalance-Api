import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SplitService } from '../split/split.service';
import { SplitMethod } from '@prisma/client';

@Injectable()
export class EquityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly split: SplitService,
  ) {}

  async getMonthlyEquity(userId: string, year: number, month: number) {
    // 1. pegar usuario + household
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        householdId: true,
      },
    });

    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma casa');
    }

    // 2. pegar household + membros
    const household = await this.prisma.household.findUnique({
      where: { id: user.householdId },
      select: {
        id: true,
        splitMethod: true,
        customSplit: true,
        members: { select: { id: true } },
      },
    });

    if (!household) throw new NotFoundException('Casa não encontrada');

    const [u1, u2] = household.members;

    if (!u1 || !u2) {
      throw new ForbiddenException('Casa deve ter dois membros');
    }

    // 3. buscar incomes do mês
    const incomes = await this.prisma.income.findMany({
      where: {
        householdId: household.id,
        receivedAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      select: { userId: true, amount: true },
    });

    // 4. buscar expenses do mês
    const expenses = await this.prisma.expense.findMany({
      where: {
        householdId: household.id,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      select: {
        id: true,
        amount: true,
        isIndividual: true,
        individualUserId: true,
        createdById: true,
      },
    });

    // 5. montar config
    const config = {
      splitMethod: household.splitMethod,
      customSplit:
        household.splitMethod === SplitMethod.CUSTOM
          ? household.customSplit
          : null,
      user1Id: u1.id,
      user2Id: u2.id,
    };

    // 6. calcular e retornar
    return this.split.calculateFinancialEquity({
      config,
      incomes,
      expenses,
    });
  }
}
