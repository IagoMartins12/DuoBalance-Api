import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { GoalStatus, GoalType } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getHouseholdIdOrThrow(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    return user.householdId;
  }

  // --------------------
  // CREATE
  // --------------------
  async create(userId: string, dto: CreateGoalDto, imageUrl?: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const goal = await this.prisma.goal.create({
      data: {
        householdId,
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        currentAmount: 0,
        type: dto.type,
        imageUrl: imageUrl ?? null,
        startDate: new Date(dto.startDate),
        targetDate: new Date(dto.targetDate),
        status: GoalStatus.IN_PROGRESS,
      },
    });

    return goal;
  }

  // --------------------
  // LIST
  // --------------------
  async list(userId: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    return this.prisma.goal.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --------------------
  // FIND ONE
  // --------------------
  async findOne(userId: string, id: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const goal = await this.prisma.goal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    return goal;
  }

  // --------------------
  // UPDATE
  // --------------------
  async update(
    userId: string,
    id: string,
    dto: UpdateGoalDto,
    imageUrl?: string,
  ) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const goal = await this.prisma.goal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    const updatedTargetAmount = dto.targetAmount ?? goal.targetAmount;

    // Recalcular status baseado no progresso e datas
    const now = new Date();
    const effectiveTargetDate = dto.targetDate
      ? new Date(dto.targetDate)
      : goal.targetDate;

    let status = dto.status ?? goal.status;

    const progress = (goal.currentAmount / updatedTargetAmount) * 100;

    if (progress >= 100) {
      status = GoalStatus.COMPLETED;
    } else if (progress >= 80 && progress < 100) {
      status = GoalStatus.NEAR_COMPLETION;
    } else if (now > effectiveTargetDate) {
      status = GoalStatus.DELAYED;
    } else {
      status = GoalStatus.IN_PROGRESS;
    }

    const updated = await this.prisma.goal.update({
      where: { id },
      data: {
        ...dto,
        imageUrl: imageUrl ?? goal.imageUrl,
        targetAmount: updatedTargetAmount,
        status,
        targetDate: effectiveTargetDate,
      },
    });

    return updated;
  }

  // --------------------
  // DELETE
  // --------------------
  async delete(userId: string, id: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const goal = await this.prisma.goal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    await this.prisma.goal.delete({ where: { id } });

    return { deleted: true };
  }

  // --------------------
  // ADD CONTRIBUTION
  // --------------------
  async addContribution(
    userId: string,
    goalId: string,
    dto: AddContributionDto,
  ) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, householdId },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    const date = dto.date ? new Date(dto.date) : new Date();

    await this.prisma.contribution.create({
      data: {
        goalId,
        dreamId: null,
        amount: dto.amount,
        date,
        note: dto.note ?? null,
      },
    });

    const agg = await this.prisma.contribution.aggregate({
      _sum: { amount: true },
      where: { goalId },
    });

    const newCurrent = agg._sum.amount ?? 0;

    const progress = (newCurrent / goal.targetAmount) * 100;
    const now = new Date();
    let status = goal.status;

    if (progress >= 100) {
      status = GoalStatus.COMPLETED;
    } else if (progress >= 80 && progress < 100) {
      status = GoalStatus.NEAR_COMPLETION;
    } else if (now > goal.targetDate) {
      status = GoalStatus.DELAYED;
    } else {
      status = GoalStatus.IN_PROGRESS;
    }

    const updated = await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: newCurrent,
        status,
      },
    });

    return updated;
  }

  // --------------------
  // SUGESTÕES INTELIGENTES DE METAS
  // --------------------
  async smartSuggestions(userId: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const now = new Date();
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate(),
    );

    const incomes = await this.prisma.income.findMany({
      where: {
        householdId,
        receivedAt: {
          gte: threeMonthsAgo,
          lte: now,
        },
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        householdId,
        date: {
          gte: threeMonthsAgo,
          lte: now,
        },
      },
    });

    const totalIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const monthlyIncome = totalIncome / 3;
    const monthlyExpenses = totalExpenses / 3;
    const possibleSaving = Math.max(monthlyIncome - monthlyExpenses, 0);

    const safeSaving = possibleSaving * 0.3; // 30% do espaço “possível”

    const suggestions: any = [];

    if (safeSaving > 0) {
      suggestions.push({
        type: GoalType.MONTHLY,
        name: 'Reserva mensal de segurança',
        description:
          'Uma meta mensal automática para criar uma reserva de emergência, sem sufocar o orçamento.',
        suggestedAmount: Number(safeSaving.toFixed(2)),
      });
    }

    suggestions.push({
      type: GoalType.ANNUAL,
      name: 'Meta anual de poupança do casal',
      description:
        'Uma meta de longo prazo usando uma parte da renda mensal para objetivos maiores.',
      suggestedAmount: Number((safeSaving * 12).toFixed(2)),
    });

    return {
      monthlyIncome: Number(monthlyIncome.toFixed(2)),
      monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
      possibleSaving: Number(possibleSaving.toFixed(2)),
      safeSaving: Number(safeSaving.toFixed(2)),
      suggestions,
    };
  }
}
