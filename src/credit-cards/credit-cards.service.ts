import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, ExpenseCategory } from '@prisma/client';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { AddTransactionDto } from './dto/add-transaction.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  private async getUserWithHousehold(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma casa');
    }

    return {
      id: user.id,
      householdId: user.householdId, // aqui TS sabe que não é null
    };
  }

  /**
   * Calcula resumo do cartão:
   * - fatura atual (somando parcelas não pagas com dueDate no mês atual)
   * - limite disponível
   */
  private async getCardSummary(cardId: string, limit: number) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1,
    );

    const installments = await this.prisma.installment.findMany({
      where: {
        isPaid: false,
        dueDate: {
          gte: monthStart,
          lt: nextMonthStart,
        },
        expense: {
          creditCardId: cardId,
        },
      },
      select: { amount: true },
    });

    const currentInvoiceAmount = installments.reduce(
      (sum, i) => sum + i.amount,
      0,
    );

    const availableLimit = limit - currentInvoiceAmount;

    return {
      currentInvoiceAmount,
      availableLimit: availableLimit < 0 ? 0 : availableLimit,
    };
  }

  /**
   * Regra para calcular dueDate das parcelas baseado em:
   * - data da compra
   * - dia de fechamento (closingDay)
   * - dia de vencimento (dueDay)
   * - número da parcela (1, 2, 3...)
   *
   * Lógica:
   * - se a compra foi ANTES ou NO dia de fechamento → cai na fatura que vence no PRÓXIMO mês
   * - se foi DEPOIS do fechamento → cai na fatura que vence no mês seguinte ao próximo
   * - parcelas seguintes adicionam +1 mês a partir da primeira
   */
  private computeInstallmentDueDate(
    purchaseDate: Date,
    closingDay: number,
    dueDay: number,
    installmentNumber: number, // 1, 2, 3...
  ): Date {
    const purchase = new Date(
      purchaseDate.getFullYear(),
      purchaseDate.getMonth(),
      purchaseDate.getDate(),
    );

    let baseMonth = purchase.getMonth();
    const baseYear = purchase.getFullYear();

    const purchaseDay = purchase.getDate();

    if (purchaseDay <= closingDay) {
      // cai na fatura que vence no mês seguinte
      baseMonth = baseMonth + 1;
    } else {
      // depois do fechamento → fatura do mês seguinte ao próximo
      baseMonth = baseMonth + 2;
    }

    // somar (installmentNumber - 1) meses em cima da fatura base
    const targetMonth = baseMonth + (installmentNumber - 1);

    const year = baseYear + Math.floor(targetMonth / 12);
    const month = targetMonth % 12;

    return new Date(year, month, dueDay);
  }

  // ----------------------------------------------------------------
  // CRUD do Cartão
  // ----------------------------------------------------------------

  async createCard(userId: string, dto: CreateCreditCardDto) {
    const user = await this.getUserWithHousehold(userId);

    return this.prisma.creditCard.create({
      data: {
        userId: user.id,
        name: dto.name,
        lastDigits: dto.lastDigits,
        brand: dto.brand,
        limit: dto.limit,
        closingDay: dto.closingDay,
        dueDay: dto.dueDay,
        color: dto.color,
        isActive: true,
      },
    });
  }

  async listCards(userId: string) {
    await this.getUserWithHousehold(userId);

    const cards = await this.prisma.creditCard.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Anexar resumo (fatura atual + limite disponível)
    const withSummary = await Promise.all(
      cards.map(async (card) => {
        const summary = await this.getCardSummary(card.id, card.limit);
        return {
          ...card,
          summary,
        };
      }),
    );

    return withSummary;
  }

  async updateCard(userId: string, cardId: string, dto: UpdateCreditCardDto) {
    await this.getUserWithHousehold(userId);

    const card = await this.prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId,
        isActive: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Cartão não encontrado');
    }

    return this.prisma.creditCard.update({
      where: { id: cardId },
      data: {
        name: dto.name ?? card.name,
        lastDigits: dto.lastDigits ?? card.lastDigits,
        brand: dto.brand ?? card.brand,
        limit: dto.limit ?? card.limit,
        closingDay: dto.closingDay ?? card.closingDay,
        dueDay: dto.dueDay ?? card.dueDay,
        color: dto.color ?? card.color,
      },
    });
  }

  async softDeleteCard(userId: string, cardId: string) {
    await this.getUserWithHousehold(userId);

    const card = await this.prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId,
        isActive: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Cartão não encontrado');
    }

    // Não permitir desativar cartão com fatura em aberto
    const summary = await this.getCardSummary(card.id, card.limit);
    if (summary.currentInvoiceAmount > 0) {
      throw new BadRequestException(
        'Não é possível desativar um cartão com fatura em aberto',
      );
    }

    return this.prisma.creditCard.update({
      where: { id: cardId },
      data: { isActive: false },
    });
  }

  // ----------------------------------------------------------------
  // Transações / Compras no cartão
  // ----------------------------------------------------------------

  /**
   * Registra uma compra no cartão, criando:
   * - uma Expense vinculada ao cartão
   * - N parcelas (Installment), inclusive se for "à vista" (N=1)
   */
  async addTransaction(userId: string, cardId: string, dto: AddTransactionDto) {
    const user = await this.getUserWithHousehold(userId);

    const card = await this.prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Cartão não encontrado');
    }

    const purchaseDate = dto.date ? new Date(dto.date) : new Date();

    if (dto.amount <= 0) {
      throw new BadRequestException(
        'O valor da compra deve ser maior que zero',
      );
    }

    const totalInstallments =
      dto.totalInstallments && dto.totalInstallments > 0
        ? dto.totalInstallments
        : 1;

    const isInstallment = totalInstallments > 1;

    // Criar despesa vinculada ao cartão
    const expense = await this.prisma.expense.create({
      data: {
        householdId: user.householdId,
        createdById: user.id,
        isIndividual: false,
        individualUserId: null,
        description: dto.description,
        amount: dto.amount,
        category: ExpenseCategory.OTHER,
        date: purchaseDate,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        creditCardId: card.id,
        isInstallment,
        totalInstallments: isInstallment ? totalInstallments : 1,
        currentInstallment: isInstallment ? (dto.currentInstallment ?? 1) : 1,
        notifyPartner: true,
      },
    });

    // Criar parcelas
    const baseAmount = dto.amount / totalInstallments;

    const installmentsData: any = [];
    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = this.computeInstallmentDueDate(
        purchaseDate,
        card.closingDay,
        card.dueDay,
        i,
      );

      installmentsData.push({
        expenseId: expense.id,
        number: i,
        amount: parseFloat(baseAmount.toFixed(2)),
        dueDate,
        isPaid: false,
      });
    }

    await this.prisma.installment.createMany({
      data: installmentsData,
    });

    // Retorna a despesa + parcelas geradas
    const full = await this.prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        installments: true,
      },
    });

    return full;
  }

  /**
   * Marca uma parcela específica como paga.
   * O usuário só pode pagar parcelas de cartões que pertencem a ele
   * e da mesma household.
   */
  async payInstallment(
    userId: string,
    cardId: string,
    installmentId: string,
    dto: PayInstallmentDto,
  ) {
    const user = await this.getUserWithHousehold(userId);

    const card = await this.prisma.creditCard.findFirst({
      where: {
        id: cardId,
        userId: user.id,
        isActive: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Cartão não encontrado');
    }

    const installment = await this.prisma.installment.findFirst({
      where: {
        id: installmentId,
        expense: {
          creditCardId: card.id,
          householdId: user.householdId,
        },
      },
      include: {
        expense: true,
      },
    });

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    if (installment.isPaid) {
      throw new BadRequestException('Parcela já está marcada como paga');
    }

    const paidAt = new Date(dto.paidAt);

    return this.prisma.installment.update({
      where: { id: installment.id },
      data: {
        isPaid: true,
        paidAt,
      },
    });
  }

  // ----------------------------------------------------------------
  // Hooks futuros para Open Finance
  // ----------------------------------------------------------------

  /**
   * Futuro: integrar com Open Finance (Pluggy / Belvo / etc)
   * para sincronizar dados de cartões automaticamente.
   *
   * Aqui podemos receber um payload externo e:
   * - criar / atualizar cartões
   * - criar / atualizar transações e parcelas
   */
  //   syncFromOpenFinanceProvider(
  //     _userId: string,
  //     _provider: 'PLUGGY' | 'BELVO' | 'OTHER',
  //     _payload: unknown,
  //   ) {
  //     // Implementação futura.
  //     // Mantido vazio de propósito para não quebrar nada,
  //     // mas já deixa o service pronto para crescer.
  //     return;
  //   }
}
