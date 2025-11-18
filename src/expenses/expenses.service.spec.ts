import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentMethod, ExpenseCategory } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';

const prismaMock = {
  user: {
    findUnique: jest.fn(),
  },
  household: {
    findUnique: jest.fn(),
  },
  creditCard: {
    findUnique: jest.fn(),
  },
  expense: {
    create: jest.fn(),
  },
  installment: {
    createMany: jest.fn(),
  },
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);

    jest.clearAllMocks();
  });

  // -------------------------------------------------------------
  // 🔹 Teste 1 — Criar despesa individual
  // -------------------------------------------------------------
  it('deve criar uma despesa individual', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prismaMock.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'u1' }],
    });

    prismaMock.expense.create.mockResolvedValue({
      id: 'exp123',
    });

    const dto: CreateExpenseDto = {
      description: 'Mercado',
      amount: 100,
      category: ExpenseCategory.GROCERIES,
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.PIX,
      isIndividual: true,
    };

    const result = await service.create('u1', dto);

    expect(result.id).toBe('exp123');
    expect(prismaMock.expense.create).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------
  // 🔹 Teste 2 — User não pertence à casa (regra B)
  // -------------------------------------------------------------
  it('deve lançar ForbiddenException se usuário não faz parte da casa', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    // household existe, mas NÃO contém o usuário u1 nos membros
    prismaMock.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'otherUser' }],
    });

    const dto: CreateExpenseDto = {
      description: 'Teste',
      amount: 50,
      category: ExpenseCategory.OTHER,
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.CASH,
    };

    await expect(service.create('u1', dto)).rejects.toThrow(ForbiddenException);
  });

  // -------------------------------------------------------------
  // 🔹 Teste 3 — Criar despesa parcelada + parcelas
  // -------------------------------------------------------------
  it('deve criar despesa parcelada e gerar parcelas', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prismaMock.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'u1' }],
    });

    prismaMock.creditCard.findUnique.mockResolvedValue({
      id: 'card123',
      userId: 'u1',
      isActive: true,
    });

    prismaMock.expense.create.mockResolvedValue({
      id: 'exp1',
    });

    prismaMock.installment.createMany.mockResolvedValue({
      count: 3,
    });

    const dto: CreateExpenseDto = {
      description: 'Compra parcelada',
      amount: 300,
      category: ExpenseCategory.GROCERIES,
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.CREDIT_CARD,
      creditCardId: 'card123',
      isInstallment: true,
      totalInstallments: 3,
      firstDueDate: new Date().toISOString(),
    };

    const result = await service.create('u1', dto);

    expect(result.id).toBe('exp1');
    expect(prismaMock.installment.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.installment.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Array),
      }),
    );
  });

  // -------------------------------------------------------------
  // 🔹 Teste 4 — Cartão inexistente
  // -------------------------------------------------------------
  it('deve lançar NotFoundException quando cartão não existir', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prismaMock.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'u1' }],
    });

    prismaMock.creditCard.findUnique.mockResolvedValue(null);

    const dto: CreateExpenseDto = {
      description: 'Compra X',
      amount: 200,
      category: ExpenseCategory.GROCERIES,
      date: new Date().toISOString(),
      paymentMethod: PaymentMethod.CREDIT_CARD,
      creditCardId: 'card999',
    };

    await expect(service.create('u1', dto)).rejects.toThrow(NotFoundException);
  });
});
