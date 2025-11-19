import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // -------------------------------
  // CREATE
  // -------------------------------
  async create(userId: string, dto: CreateBudgetDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    const exists = await this.prisma.budget.findUnique({
      where: {
        householdId_category_month_year: {
          householdId: user.householdId,
          category: dto.category,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (exists) {
      throw new ConflictException('Orçamento já existe para esse período');
    }

    const spent = await this.totalExpenses(
      user.householdId,
      dto.category,
      dto.month,
      dto.year,
    );

    const percentage = (spent / dto.amount) * 100;

    // 1) Criar o orçamento primeiro
    const budget = await this.prisma.budget.create({
      data: {
        householdId: user.householdId,
        ...dto,
        spent,
        percentage,
      },
    });

    // 2) Só depois emitir notificações (agora temos budget.id)
    if (percentage >= 80 && percentage < 100) {
      await this.notifications.emitBudgetNotification({
        householdId: user.householdId,
        budgetId: budget.id,
        type: 'BUDGET_WARNING',
        spent,
        amount: dto.amount,
      });
    }

    if (percentage >= 100) {
      await this.notifications.emitBudgetNotification({
        householdId: user.householdId,
        budgetId: budget.id,
        type: 'BUDGET_CRITICAL',
        spent,
        amount: dto.amount,
      });
    }

    return budget;
  }

  // -------------------------------
  // LIST
  // -------------------------------
  async list(userId: string, month: number, year: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    return this.prisma.budget.findMany({
      where: {
        householdId: user.householdId,
        month,
        year,
      },
    });
  }

  // -------------------------------
  // UPDATE
  // -------------------------------
  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    const budget = await this.prisma.budget.findFirst({
      where: { id, householdId: user.householdId },
    });

    if (!budget) throw new NotFoundException('Orçamento não encontrado');

    const spent = await this.totalExpenses(
      user.householdId,
      budget.category,
      budget.month,
      budget.year,
    );

    const newAmount = dto.amount ?? budget.amount;

    const percentage = (spent / newAmount) * 100;
    if (percentage >= 80 && percentage < 100) {
      await this.notifications.emitBudgetNotification({
        householdId: user.householdId,
        budgetId: budget.id,
        type: 'BUDGET_WARNING',
        spent,
        amount: newAmount, // CORRIGIDO!
      });
    }

    // emitir notificação 100%+
    if (percentage >= 100) {
      await this.notifications.emitBudgetNotification({
        householdId: user.householdId,
        budgetId: budget.id,
        type: 'BUDGET_CRITICAL',
        spent,
        amount: newAmount, // CORRIGIDO!
      });
    }

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...dto,
        spent,
        percentage,
      },
    });
  }

  // -------------------------------
  // DELETE
  // -------------------------------
  async delete(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    const budget = await this.prisma.budget.findFirst({
      where: { id, householdId: user.householdId },
    });

    if (!budget) throw new NotFoundException('Orçamento não encontrado');

    await this.prisma.budget.delete({ where: { id } });

    return { deleted: true };
  }

  // -------------------------------
  // HELPER — CALCULA GASTOS
  // -------------------------------
  async totalExpenses(
    householdId: string,
    category: any,
    month: number,
    year: number,
  ) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        householdId,
        category,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    return expenses.reduce((acc, e) => acc + e.amount, 0);
  }
}
