import { Test, TestingModule } from '@nestjs/testing';
import { EquityService } from './equity.service';
import { PrismaService } from '../prisma/prisma.service';
import { SplitService } from '../split/split.service';
import { SplitMethod } from '@prisma/client';

const prismaMock = {
  user: { findUnique: jest.fn() },
  household: { findUnique: jest.fn() },
  income: { findMany: jest.fn() },
  expense: { findMany: jest.fn() },
};

describe('EquityService', () => {
  let service: EquityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquityService,
        SplitService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<EquityService>(EquityService);

    jest.clearAllMocks();
  });

  it('deve calcular equity mensal corretamente', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prismaMock.household.findUnique.mockResolvedValue({
      id: 'h1',
      splitMethod: SplitMethod.FIFTY_FIFTY,
      customSplitUser1: null,
      customSplitUser2: null,
      members: [{ id: 'u1' }, { id: 'u2' }],
    });

    prismaMock.income.findMany.mockResolvedValue([
      { userId: 'u1', amount: 3000 },
      { userId: 'u2', amount: 2000 },
    ]);

    prismaMock.expense.findMany.mockResolvedValue([
      { id: 'e1', amount: 300, isIndividual: false, createdById: 'u1' },
      { id: 'e2', amount: 200, isIndividual: false, createdById: 'u2' },
    ]);

    const result = await service.getMonthlyEquity('u1', 2025, 11);

    expect(result.totalExpenses).toBe(500);
    expect(result.user1Paid).toBe(300);
    expect(result.user2Paid).toBe(200);

    expect(result.user1Should).toBe(250);
    expect(result.user2Should).toBe(250);

    expect(result.user1Balance).toBe(50);
    expect(result.user2Balance).toBe(-50);
  });
});
