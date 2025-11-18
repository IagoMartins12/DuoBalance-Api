import { RecurringJobsService } from './recurring-jobs.service';
import { Frequency } from '@prisma/client';

describe('RecurringJobsService', () => {
  let service: RecurringJobsService;

  beforeEach(() => {
    service = new RecurringJobsService();
  });

  // ------------------------------------------
  // 🔹 Recorrência (rendas/despesas)
  // ------------------------------------------

  it('deve calcular próxima data semanal', () => {
    const next = service.getNextRecurringDate({
      id: '1',
      amount: 100,
      isRecurring: true,
      frequency: Frequency.WEEKLY,
      lastOccurrence: new Date('2025-01-01'),
    });

    expect(next?.toISOString()).toBe(new Date('2025-01-08').toISOString());
  });

  it('deve calcular próxima data mensal', () => {
    const next = service.getNextRecurringDate({
      id: '1',
      amount: 100,
      isRecurring: true,
      frequency: Frequency.MONTHLY,
      lastOccurrence: new Date('2025-01-10'),
    });

    expect(next?.toISOString()).toBe(new Date('2025-02-10').toISOString());
  });

  // ------------------------------------------
  // 🔹 Parcelas
  // ------------------------------------------

  it('não gera parcela se já está na última', () => {
    const result = service.shouldGenerateNextInstallment(
      {
        id: 'inst1',
        expenseId: 'exp1',
        amount: 100,
        number: 3,
        totalInstallments: 3,
        dueDate: new Date('2025-01-10'),
        isPaid: false,
      },
      new Date('2025-02-10'),
    );

    expect(result).toBe(false);
  });

  it('gera parcela se dueDate passou', () => {
    const result = service.shouldGenerateNextInstallment(
      {
        id: 'inst1',
        expenseId: 'exp1',
        amount: 100,
        number: 1,
        totalInstallments: 3,
        dueDate: new Date('2025-01-10'),
        isPaid: false,
      },
      new Date('2025-02-10'),
    );

    expect(result).toBe(true);
  });

  it('deve gerar próxima parcela corretamente', () => {
    const next = service.generateNextInstallment({
      id: 'inst1',
      expenseId: 'exp1',
      amount: 100,
      number: 1,
      totalInstallments: 3,
      dueDate: new Date('2025-01-10'),
      isPaid: false,
    });

    expect(next.number).toBe(2);
    expect(next.dueDate.toISOString()).toBe(
      new Date('2025-02-10').toISOString(),
    );
  });
});
