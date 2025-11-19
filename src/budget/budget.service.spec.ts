import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/prisma-mock';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: ReturnType<typeof createPrismaMock>;
  const notificationsMock = {
    emitBudgetNotification: jest.fn(),
    create: jest.fn(),
    listForUser: jest.fn(),
    markAsRead: jest.fn(),
  };
  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });
  const userWithHousehold = {
    householdId: 'h1',
  };

  // Helper para mockar usuário com household
  function mockUserWithHousehold() {
    prisma.user.findUnique.mockResolvedValue(userWithHousehold);
  }

  // ------------------------
  // CREATE
  // ------------------------
  it('deve criar um orçamento com spent/percentage calculados', async () => {
    mockUserWithHousehold();

    prisma.budget.findUnique.mockResolvedValue(null); // não existe ainda

    prisma.expense.findMany.mockResolvedValue([
      { amount: 100 },
      { amount: 50 },
    ] as any); // total spent = 150

    prisma.budget.create.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
      category: ExpenseCategory.GROCERIES,
      month: 1,
      year: 2025,
      amount: 300,
      spent: 150,
      percentage: 50,
    } as any);

    const result = await service.create('u1', {
      category: ExpenseCategory.GROCERIES,
      amount: 300,
      month: 1,
      year: 2025,
    });

    expect(result.id).toBe('b1');
    expect(prisma.budget.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          spent: 150,
          percentage: 50,
        }),
      }),
    );
  });

  it('deve lançar Forbidden se usuário não tiver household ao criar', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.create('u1', {
        category: ExpenseCategory.GROCERIES,
        amount: 300,
        month: 1,
        year: 2025,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar Conflict se orçamento já existir para o período', async () => {
    mockUserWithHousehold();

    prisma.budget.findUnique.mockResolvedValue({
      id: 'b1',
    } as any);

    await expect(
      service.create('u1', {
        category: ExpenseCategory.GROCERIES,
        amount: 300,
        month: 1,
        year: 2025,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // ------------------------
  // LIST
  // ------------------------
  it('deve listar orçamentos da casa para mês/ano', async () => {
    mockUserWithHousehold();

    prisma.budget.findMany.mockResolvedValue([
      { id: 'b1' },
      { id: 'b2' },
    ] as any);

    const result = await service.list('u1', 1, 2025);

    expect(result).toHaveLength(2);
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: {
        householdId: 'h1',
        month: 1,
        year: 2025,
      },
    });
  });

  it('deve lançar Forbidden ao listar sem household', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.list('u1', 1, 2025)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ------------------------
  // UPDATE
  // ------------------------
  it('deve atualizar orçamento e recalcular percentage', async () => {
    mockUserWithHousehold();

    prisma.budget.findFirst.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
      category: ExpenseCategory.GROCERIES,
      amount: 300,
      month: 1,
      year: 2025,
    } as any);

    prisma.expense.findMany.mockResolvedValue([{ amount: 200 }] as any); // spent = 200

    prisma.budget.update.mockResolvedValue({
      id: 'b1',
      amount: 400,
      spent: 200,
      percentage: 50,
    } as any);

    const result = await service.update('u1', 'b1', {
      amount: 400,
    });

    expect(prisma.budget.update).toHaveBeenCalledWith({
      where: { id: 'b1' },
      data: expect.objectContaining({
        amount: 400,
        spent: 200,
        percentage: 50,
      }),
    });
    expect(result.percentage).toBe(50);
  });

  it('deve lançar NotFound ao atualizar orçamento inexistente', async () => {
    mockUserWithHousehold();
    prisma.budget.findFirst.mockResolvedValue(null);

    await expect(service.update('u1', 'b-x', { amount: 500 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve lançar Forbidden ao atualizar sem household', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.update('u1', 'b1', { amount: 500 })).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ------------------------
  // DELETE
  // ------------------------
  it('deve deletar orçamento', async () => {
    mockUserWithHousehold();

    prisma.budget.findFirst.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
    } as any);

    prisma.budget.delete.mockResolvedValue({ id: 'b1' } as any);

    const result = await service.delete('u1', 'b1');

    expect(result).toEqual({ deleted: true });
    expect(prisma.budget.delete).toHaveBeenCalledWith({
      where: { id: 'b1' },
    });
  });

  it('deve lançar NotFound ao deletar orçamento inexistente', async () => {
    mockUserWithHousehold();

    prisma.budget.findFirst.mockResolvedValue(null);

    await expect(service.delete('u1', 'b-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve lançar Forbidden ao deletar sem household', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.delete('u1', 'b1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ------------------------
  // totalExpenses helper
  // ------------------------
  it('totalExpenses deve somar todas as despesas da categoria no mês/ano', async () => {
    prisma.expense.findMany.mockResolvedValue([
      { amount: 100 },
      { amount: 250.5 },
    ] as any);

    const total = await service.totalExpenses(
      'h1',
      ExpenseCategory.GROCERIES,
      1,
      2025,
    );

    expect(total).toBe(350.5);
    expect(prisma.expense.findMany).toHaveBeenCalled();
  });
});
