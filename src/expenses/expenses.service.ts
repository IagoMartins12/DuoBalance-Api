import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o usuário existe, está vinculado a uma Casa Financeira
   * e efetivamente faz parte dos membros dessa casa (regra B).
   */
  private async ensureUserWithHousehold(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.householdId) {
      throw new BadRequestException(
        'Usuário não está vinculado a uma Casa Financeira',
      );
    }

    const household = await this.prisma.household.findUnique({
      where: { id: user.householdId },
      select: {
        id: true,
        members: {
          select: { id: true },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Casa Financeira não encontrada');
    }

    const isMember = household.members.some((m) => m.id === user.id);

    if (!isMember) {
      throw new ForbiddenException(
        'Usuário não faz parte desta Casa Financeira',
      );
    }

    return user;
  }

  private async ensureCreditCardIfNeeded(
    userId: string,
    dto: CreateExpenseDto,
  ) {
    if (dto.paymentMethod !== PaymentMethod.CREDIT_CARD) return;

    if (!dto.creditCardId) {
      throw new BadRequestException(
        'creditCardId é obrigatório quando o método de pagamento é cartão de crédito',
      );
    }

    const card = await this.prisma.creditCard.findUnique({
      where: { id: dto.creditCardId },
      select: { id: true, userId: true, isActive: true },
    });

    if (!card || !card.isActive) {
      throw new NotFoundException(
        'Cartão de crédito não encontrado ou inativo',
      );
    }

    if (card.userId !== userId) {
      throw new ForbiddenException(
        'Você não pode utilizar um cartão de crédito de outro usuário',
      );
    }
  }

  private validateInstallments(dto: CreateExpenseDto) {
    if (!dto.isInstallment) return;

    if (!dto.totalInstallments || dto.totalInstallments < 1) {
      throw new BadRequestException(
        'totalInstallments deve ser informado e ser maior ou igual a 1 para despesas parceladas',
      );
    }

    if (!dto.firstDueDate) {
      throw new BadRequestException(
        'firstDueDate é obrigatório para despesas parceladas',
      );
    }
  }

  private generateInstallmentsData(
    expenseId: string,
    totalAmount: number,
    totalInstallments: number,
    firstDueDate: Date,
  ) {
    const baseAmount = totalAmount / totalInstallments;

    const installments: any[] = [];

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        expenseId,
        number: i + 1,
        amount: baseAmount,
        dueDate,
        isPaid: false,
      });
    }

    return installments;
  }

  async create(userId: string, dto: CreateExpenseDto) {
    const user = await this.ensureUserWithHousehold(userId);

    await this.ensureCreditCardIfNeeded(userId, dto);
    this.validateInstallments(dto);

    const isIndividual = dto.isIndividual ?? false;

    const expense = await this.prisma.expense.create({
      data: {
        householdId: user.householdId!,
        createdById: user.id,
        isIndividual,
        individualUserId: isIndividual ? user.id : null,
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        date: new Date(dto.date),
        paymentMethod: dto.paymentMethod,
        creditCardId: dto.creditCardId ?? null,
        isInstallment: dto.isInstallment ?? false,
        totalInstallments: dto.isInstallment ? dto.totalInstallments : null,
        currentInstallment: null,
      },
    });

    if (dto.isInstallment && dto.totalInstallments && dto.firstDueDate) {
      const installmentsData = this.generateInstallmentsData(
        expense.id,
        dto.amount,
        dto.totalInstallments,
        new Date(dto.firstDueDate),
      );

      await this.prisma.installment.createMany({
        data: installmentsData,
      });
    }

    return expense;
  }

  async findAll(
    userId: string,
    params?: {
      month?: number;
      year?: number;
      category?: ExpenseCategory;
      isIndividual?: boolean;
    },
  ) {
    const user = await this.ensureUserWithHousehold(userId);

    const where: any = {
      householdId: user.householdId!,
    };

    if (typeof params?.isIndividual === 'boolean') {
      where.isIndividual = params.isIndividual;
    }

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.month && params?.year) {
      const start = new Date(params.year, params.month - 1, 1);
      const end = new Date(params.year, params.month, 1);
      where.date = {
        gte: start,
        lt: end,
      };
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const user = await this.ensureUserWithHousehold(userId);

    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        householdId: user.householdId!,
      },
    });

    if (!expense) {
      throw new NotFoundException('Despesa não encontrada');
    }

    return expense;
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    const user = await this.ensureUserWithHousehold(userId);

    const existing = await this.prisma.expense.findFirst({
      where: {
        id,
        householdId: user.householdId!,
      },
    });

    if (!existing) {
      throw new NotFoundException('Despesa não encontrada');
    }

    if (existing.createdById !== user.id) {
      // regra: só quem criou pode editar
      throw new ForbiddenException('Você não pode editar esta despesa');
    }

    if (dto.paymentMethod === PaymentMethod.CREDIT_CARD && !dto.creditCardId) {
      throw new BadRequestException(
        'creditCardId é obrigatório quando o método de pagamento é cartão de crédito',
      );
    }

    // Não permitimos alterar parcelamento via update nesta primeira versão
    const { isIndividual, ...rest } = dto;

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        date: dto.date ? new Date(dto.date) : undefined,
        isIndividual:
          typeof isIndividual === 'boolean'
            ? isIndividual
            : existing.isIndividual,
        individualUserId:
          typeof isIndividual === 'boolean'
            ? isIndividual
              ? user.id
              : null
            : existing.individualUserId,
      },
    });

    return updated;
  }

  async remove(userId: string, id: string) {
    const user = await this.ensureUserWithHousehold(userId);

    const existing = await this.prisma.expense.findFirst({
      where: {
        id,
        householdId: user.householdId!,
      },
      select: {
        id: true,
        createdById: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Despesa não encontrada');
    }

    if (existing.createdById !== user.id) {
      throw new ForbiddenException('Você não pode excluir esta despesa');
    }

    // Exclui as parcelas associadas (onDelete: Cascade já ajuda, mas garantimos)
    await this.prisma.installment.deleteMany({
      where: { expenseId: id },
    });

    await this.prisma.expense.delete({
      where: { id },
    });

    return { success: true };
  }
}
