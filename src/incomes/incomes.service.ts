import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';

@Injectable()
export class IncomesService {
  constructor(private prisma: PrismaService) {}

  private ensureUserHasHousehold(user: {
    id: string;
    householdId: string | null;
  }) {
    if (!user.householdId) {
      throw new BadRequestException(
        'Usuário precisa estar vinculado a uma Casa Financeira para registrar renda',
      );
    }
  }

  private buildDateFilter(query: IncomeQueryDto) {
    if (!query.year || !query.month) return {};

    const { year, month } = query;
    const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const to = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // mês seguinte

    return {
      gte: from,
      lt: to,
    };
  }

  async create(userId: string, dto: CreateIncomeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    this.ensureUserHasHousehold(user);

    return this.prisma.income.create({
      data: {
        householdId: user.householdId!,
        userId: user.id,
        source: dto.source,
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        receivedAt: new Date(dto.receivedAt),
        isRecurring: dto.isRecurring ?? false,
      },
    });
  }

  async findMyIncomes(userId: string, query: IncomeQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    this.ensureUserHasHousehold(user);

    const dateFilter = this.buildDateFilter(query);

    return this.prisma.income.findMany({
      where: {
        userId: user.id,
        householdId: user.householdId!,
        ...(dateFilter && Object.keys(dateFilter).length
          ? { receivedAt: dateFilter }
          : {}),
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findHouseholdIncomes(userId: string, query: IncomeQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    this.ensureUserHasHousehold(user);

    const dateFilter = this.buildDateFilter(query);

    return this.prisma.income.findMany({
      where: {
        householdId: user.householdId!,
        ...(dateFilter && Object.keys(dateFilter).length
          ? { receivedAt: dateFilter }
          : {}),
      },
      orderBy: [{ userId: 'asc' }, { receivedAt: 'desc' }],
    });
  }

  async update(userId: string, incomeId: string, dto: UpdateIncomeDto) {
    const income = await this.prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income) throw new NotFoundException('Renda não encontrada');
    if (income.userId !== userId) {
      throw new ForbiddenException('Você só pode editar suas próprias rendas');
    }

    return this.prisma.income.update({
      where: { id: incomeId },
      data: {
        source: dto.source ?? income.source,
        amount: dto.amount ?? income.amount,
        type: dto.type ?? income.type,
        frequency: dto.frequency ?? income.frequency,
        receivedAt: dto.receivedAt
          ? new Date(dto.receivedAt)
          : income.receivedAt,
        isRecurring:
          typeof dto.isRecurring === 'boolean'
            ? dto.isRecurring
            : income.isRecurring,
      },
    });
  }

  async remove(userId: string, incomeId: string) {
    const income = await this.prisma.income.findUnique({
      where: { id: incomeId },
    });

    if (!income) throw new NotFoundException('Renda não encontrada');
    if (income.userId !== userId) {
      throw new ForbiddenException('Você só pode excluir suas próprias rendas');
    }

    await this.prisma.income.delete({ where: { id: incomeId } });

    return { success: true };
  }

  async getMonthlySummary(userId: string, query: IncomeQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    this.ensureUserHasHousehold(user);

    if (!query.year || !query.month) {
      throw new BadRequestException(
        'Parâmetros year e month são obrigatórios para o resumo mensal',
      );
    }

    const dateFilter = this.buildDateFilter(query);

    const incomes = await this.prisma.income.findMany({
      where: {
        householdId: user.householdId!,
        receivedAt: dateFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            color: true,
          },
        },
      },
    });

    const byUser = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        color: string;
        totalAmount: number;
      }
    >();

    for (const inc of incomes) {
      const key = inc.userId;
      const existing = byUser.get(key);
      if (!existing) {
        byUser.set(key, {
          userId: inc.userId,
          name: inc.user.name,
          email: inc.user.email,
          color: inc.user.color,
          totalAmount: inc.amount,
        });
      } else {
        existing.totalAmount += inc.amount;
      }
    }

    const users = Array.from(byUser.values());
    const totalHouseholdAmount = users.reduce(
      (sum, u) => sum + u.totalAmount,
      0,
    );

    return {
      householdId: user.householdId!,
      year: query.year,
      month: query.month,
      totalHouseholdAmount,
      users,
    };
  }
}
