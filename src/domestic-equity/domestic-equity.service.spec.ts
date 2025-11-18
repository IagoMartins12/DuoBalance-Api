import { Test, TestingModule } from '@nestjs/testing';
import { DomesticEquityService } from './domestic-equity.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../test/prisma-mock';

describe('DomesticEquityService', () => {
  let service: DomesticEquityService;
  let prisma = createPrismaMock();

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      household: { findUnique: jest.fn() },
      domesticTaskEntry: { findMany: jest.fn() },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomesticEquityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DomesticEquityService>(DomesticEquityService);
  });

  // ----------------------
  // Casos de erro
  // ----------------------
  it('deve lançar erro se usuário não tem casa', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getMonthlyDomesticEquity('u1', 2025, 1),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deve lançar erro se household não existe', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.household.findUnique.mockResolvedValue(null);

    await expect(
      service.getMonthlyDomesticEquity('u1', 2025, 1),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve lançar erro se casa não tem 2 membros', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'u1' }],
    });

    await expect(
      service.getMonthlyDomesticEquity('u1', 2025, 1),
    ).rejects.toThrow(ForbiddenException);
  });

  // ----------------------
  // Sucesso
  // ----------------------
  it('deve calcular equidade doméstica corretamente', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.household.findUnique.mockResolvedValue({
      id: 'h1',
      members: [{ id: 'u1' }, { id: 'u2' }],
    });

    prisma.domesticTaskEntry.findMany.mockResolvedValue([
      {
        userId: 'u1',
        hours: 1,
        template: { weight: 'MEDIUM' }, // 2 pts
      },
      {
        userId: 'u2',
        hours: 2,
        template: { weight: 'LIGHT' }, // 1*2 = 2 pts
      },
    ] as any);

    const res = await service.getMonthlyDomesticEquity('u1', 2025, 1);

    expect(res.totalPoints).toBe(4);
    expect(res.user1Points).toBe(2);
    expect(res.user2Points).toBe(2);
    expect(prisma.domesticTaskEntry.findMany).toHaveBeenCalled();
  });
});
