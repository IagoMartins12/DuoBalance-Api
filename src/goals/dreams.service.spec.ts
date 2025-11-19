import { Test, TestingModule } from '@nestjs/testing';
import { ContributionService } from './contribution.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createPrismaMock } from 'test/prisma-mock';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('ContributionService', () => {
  let service: ContributionService;
  let prisma: any;
  let notifications: { create: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    notifications = {
      create: jest.fn(),
    } as any;

    // Garantir que goal / dream / contribution / aiMessage existem no mock
    prisma.goal = {
      findFirst: jest.fn(),
      update: jest.fn(),
    };
    prisma.dream = {
      findFirst: jest.fn(),
      update: jest.fn(),
    };
    prisma.contribution = {
      create: jest.fn(),
      aggregate: jest.fn(),
    };
    prisma.aiMessage = {
      create: jest.fn(),
    };
    prisma.user.findUnique.mockResolvedValue({
      id: 'user1',
      householdId: 'house1',
    } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributionService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get<ContributionService>(ContributionService);
  });

  it('deve lançar BadRequest se amount <= 0 ao contribuir para meta', async () => {
    await expect(
      service.contributeToGoal('user1', 'goal1', { amount: 0 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve lançar Forbidden se usuário não tiver household ao contribuir para meta', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null as any);

    await expect(
      service.contributeToGoal('user1', 'goal1', { amount: 100 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deve lançar NotFound se meta não existir', async () => {
    prisma.goal.findFirst.mockResolvedValue(null);

    await expect(
      service.contributeToGoal('user1', 'goal1', { amount: 100 } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve criar contribuição para meta e atualizar currentAmount', async () => {
    prisma.goal.findFirst.mockResolvedValue({
      id: 'goal1',
      householdId: 'house1',
      name: 'Meta teste',
      targetAmount: 1000,
      currentAmount: 200,
      status: 'IN_PROGRESS',
      completedAt: null,
    });

    prisma.contribution.aggregate.mockResolvedValue({
      _sum: { amount: 300 }, // total novo
    });

    prisma.goal.update.mockResolvedValue({
      id: 'goal1',
      householdId: 'house1',
      name: 'Meta teste',
      targetAmount: 1000,
      currentAmount: 300,
      status: 'IN_PROGRESS',
      completedAt: null,
    });

    const result = await service.contributeToGoal('user1', 'goal1', {
      amount: 100,
      note: 'Teste',
    });

    expect(prisma.contribution.create).toHaveBeenCalled();
    expect(result.currentAmount).toBe(300);
  });

  it('deve criar contribuição para sonho e atualizar currentAmount', async () => {
    prisma.dream.findFirst.mockResolvedValue({
      id: 'dream1',
      householdId: 'house1',
      name: 'Viagem',
      targetAmount: 5000,
      currentAmount: 1000,
      status: 'IN_PROGRESS',
      completedAt: null,
    });

    prisma.contribution.aggregate.mockResolvedValue({
      _sum: { amount: 1500 },
    });

    prisma.dream.update.mockResolvedValue({
      id: 'dream1',
      householdId: 'house1',
      name: 'Viagem',
      targetAmount: 5000,
      currentAmount: 1500,
      status: 'IN_PROGRESS',
      completedAt: null,
    });

    const result = await service.contributeToDream('user1', 'dream1', {
      amount: 500,
    } as any);

    expect(prisma.contribution.create).toHaveBeenCalled();
    expect(result.currentAmount).toBe(1500);
  });
});
