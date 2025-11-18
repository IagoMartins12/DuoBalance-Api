import { Injectable } from '@nestjs/common';
import { Frequency } from '@prisma/client';

export interface RecurringItem {
  id: string;
  amount: number;
  isRecurring: boolean;
  frequency: Frequency;
  lastOccurrence: Date;
}

export interface InstallmentItem {
  id: string;
  expenseId: string;
  amount: number;
  number: number; // parcela atual
  totalInstallments: number;
  dueDate: Date;
  isPaid: boolean;
}

@Injectable()
export class RecurringJobsService {
  private addFrequency(date: Date, freq: Frequency) {
    const copy = new Date(date);

    switch (freq) {
      case Frequency.WEEKLY:
        copy.setDate(copy.getDate() + 7);
        break;
      case Frequency.BIWEEKLY:
        copy.setDate(copy.getDate() + 14);
        break;
      case Frequency.MONTHLY:
        copy.setMonth(copy.getMonth() + 1);
        break;
      case Frequency.YEARLY:
        copy.setFullYear(copy.getFullYear() + 1);
        break;
      default:
        return date;
    }

    return copy;
  }
  private normalizeUtc(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  // ----------------------------------------------------------------
  // 🔹 1. Rendas / Despesas Recorrentes
  // ----------------------------------------------------------------

  getNextRecurringDate(item: RecurringItem): Date | null {
    if (!item.isRecurring) return null;
    return this.addFrequency(item.lastOccurrence, item.frequency);
  }

  // ----------------------------------------------------------------
  // 🔹 2. Parcelas
  // ----------------------------------------------------------------

  shouldGenerateNextInstallment(last: InstallmentItem, today: Date): boolean {
    if (last.number >= last.totalInstallments) return false;
    return last.dueDate <= today;
  }

  generateNextInstallment(last: InstallmentItem): InstallmentItem {
    const nextDue = new Date(
      Date.UTC(
        last.dueDate.getUTCFullYear(),
        last.dueDate.getUTCMonth() + 1,
        last.dueDate.getUTCDate(),
      ),
    );

    return {
      id: `inst-${last.expenseId}-${last.number + 1}`,
      expenseId: last.expenseId,
      amount: last.amount,
      number: last.number + 1,
      totalInstallments: last.totalInstallments,
      dueDate: nextDue,
      isPaid: false,
    };
  }
}
