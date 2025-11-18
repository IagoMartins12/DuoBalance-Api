import { Test } from '@nestjs/testing';
import { IncomesService } from './incomes.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeType, Frequency } from '@prisma/client';

describe('IncomesService', () => {
  let service: IncomesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IncomesService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            income: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(IncomesService);
    prisma = module.get(PrismaService);
  });

  it('deve impedir criar renda sem household', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      householdId: null,
    });

    await expect(
      service.create('u1', {
        source: 'Salário',
        amount: 1000,
        type: IncomeType.SALARY,
        frequency: Frequency.MONTHLY,
        receivedAt: new Date().toISOString(),
        isRecurring: true,
      }),
    ).rejects.toThrow(
      'Usuário precisa estar vinculado a uma Casa Financeira para registrar renda',
    );
  });

  it('deve calcular resumo mensal agrupado por usuário', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    (prisma.income.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'i1',
        householdId: 'h1',
        userId: 'u1',
        amount: 1000,
        receivedAt: new Date(),
        source: 'Salário',
        type: IncomeType.SALARY,
        frequency: Frequency.MONTHLY,
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'u1',
          name: 'User 1',
          email: 'u1@test.com',
          color: '#111',
        },
      },
      {
        id: 'i2',
        householdId: 'h1',
        userId: 'u2',
        amount: 2000,
        receivedAt: new Date(),
        source: 'Salário',
        type: IncomeType.SALARY,
        frequency: Frequency.MONTHLY,
        isRecurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'u2',
          name: 'User 2',
          email: 'u2@test.com',
          color: '#222',
        },
      },
    ]);

    const summary = await service.getMonthlySummary('u1', {
      year: 2025,
      month: 11,
    });

    expect(summary.totalHouseholdAmount).toBe(3000);
    expect(summary.users).toHaveLength(2);
  });
});
