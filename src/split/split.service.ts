import { Injectable } from '@nestjs/common';
import { SplitMethod } from '@prisma/client';

export interface SplitConfig {
  splitMethod: SplitMethod;
  customSplit?: {
    user1Percentage: number;
    user2Percentage: number;
  } | null;
  user1Id: string;
  user2Id: string;
}

export interface IncomeLike {
  userId: string;
  amount: number;
}

export interface ExpenseLike {
  id: string;
  amount: number;
  isIndividual: boolean;
  individualUserId?: string | null;
  createdById: string;
}

export interface ExpenseSplitResult {
  user1Share: number;
  user2Share: number;
}

export interface FinancialEquityInput {
  config: SplitConfig;
  incomes: IncomeLike[];
  expenses: ExpenseLike[];
}

export interface FinancialEquityResult {
  user1Id: string;
  user1Paid: number;
  user1Should: number;
  user1Balance: number;

  user2Id: string;
  user2Paid: number;
  user2Should: number;
  user2Balance: number;

  totalExpenses: number;
}

@Injectable()
export class SplitService {
  /**
   * Calcula quanto cada usuário DEVERIA pagar em UMA despesa compartilhada,
   * de acordo com o splitMethod.
   */
  calculateExpenseSplit(
    config: SplitConfig,
    incomeContext: { user1Income: number; user2Income: number },
    expense: ExpenseLike,
  ): ExpenseSplitResult {
    const { splitMethod, customSplit, user1Id, user2Id } = config;

    // Se for individual, a responsabilidade é 100% do dono
    if (expense.isIndividual && expense.individualUserId) {
      if (expense.individualUserId === user1Id) {
        return { user1Share: expense.amount, user2Share: 0 };
      }
      if (expense.individualUserId === user2Id) {
        return { user1Share: 0, user2Share: expense.amount };
      }
    }

    // Despesa compartilhada
    switch (splitMethod) {
      case SplitMethod.FIFTY_FIFTY: {
        const half = expense.amount / 2;
        return { user1Share: half, user2Share: half };
      }

      case SplitMethod.CUSTOM: {
        const u1p = customSplit?.user1Percentage ?? 50;
        const u2p = customSplit?.user2Percentage ?? 50;
        const total = u1p + u2p || 1;

        return {
          user1Share: (expense.amount * u1p) / total,
          user2Share: (expense.amount * u2p) / total,
        };
      }

      case SplitMethod.PROPORTIONAL: {
        const { user1Income, user2Income } = incomeContext;
        const totalIncome = user1Income + user2Income;

        if (totalIncome <= 0) {
          // fallback para 50/50
          const half = expense.amount / 2;
          return { user1Share: half, user2Share: half };
        }

        return {
          user1Share: (expense.amount * user1Income) / totalIncome,
          user2Share: (expense.amount * user2Income) / totalIncome,
        };
      }

      case SplitMethod.ONE_PAYS: {
        // Regra: quem criou a despesa é quem "deveria" pagar
        if (expense.createdById === user1Id) {
          return { user1Share: expense.amount, user2Share: 0 };
        }
        if (expense.createdById === user2Id) {
          return { user1Share: 0, user2Share: expense.amount };
        }
        // fallback se criador não for nenhum dos dois (caso estranho)
        const half = expense.amount / 2;
        return { user1Share: half, user2Share: half };
      }

      case SplitMethod.NO_SPLIT: {
        // "Não separa o dinheiro": a despesa é da casa, não entra na cobrança de quem deveria pagar.
        // Então, do ponto de vista de equidade, ninguém "deveria" pagar nada.
        return { user1Share: 0, user2Share: 0 };
      }

      default: {
        const half = expense.amount / 2;
        return { user1Share: half, user2Share: half };
      }
    }
  }

  /**
   * Calcula a equidade financeira do período:
   * - quanto cada um PAGOU de fato
   * - quanto cada um DEVERIA pagar segundo o split
   * - saldo (positivo = pagou mais do que deveria, negativo = pagou menos)
   */
  calculateFinancialEquity(input: FinancialEquityInput): FinancialEquityResult {
    const { config, incomes, expenses } = input;
    const { user1Id, user2Id } = config;

    const user1Income = incomes
      .filter((i) => i.userId === user1Id)
      .reduce((acc, i) => acc + i.amount, 0);

    const user2Income = incomes
      .filter((i) => i.userId === user2Id)
      .reduce((acc, i) => acc + i.amount, 0);

    const incomeContext = { user1Income, user2Income };

    let user1Paid = 0;
    let user2Paid = 0;
    let user1Should = 0;
    let user2Should = 0;
    let totalExpenses = 0;

    for (const exp of expenses) {
      totalExpenses += exp.amount;

      // Quem PAGOU de fato (regra simples: criador paga)
      if (exp.createdById === user1Id) {
        user1Paid += exp.amount;
      } else if (exp.createdById === user2Id) {
        user2Paid += exp.amount;
      }

      // Quanto cada um DEVERIA pagar
      const { user1Share, user2Share } = this.calculateExpenseSplit(
        config,
        incomeContext,
        exp,
      );

      user1Should += user1Share;
      user2Should += user2Share;
    }

    const user1Balance = user1Paid - user1Should;
    const user2Balance = user2Paid - user2Should;

    return {
      user1Id,
      user1Paid,
      user1Should,
      user1Balance,
      user2Id,
      user2Paid,
      user2Should,
      user2Balance,
      totalExpenses,
    };
  }
}
