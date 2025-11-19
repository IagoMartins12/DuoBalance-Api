import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from './goals.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/prisma-mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GoalStatus, GoalType } from '@prisma/client';

describe('GoalsService', () => {
  let service: GoalsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoalsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('deve criar uma meta para o household do usuário', async () => {
    prisma.user.findUnique.mockResolvedValue({
      householdId: 'house1',
    });

    prisma.goal.create.mockResolvedValue({
      id: 'g1',
      householdId: 'house1',
      name: 'Meta teste',
      targetAmount: 1000,
      currentAmount: 0,
      type: GoalType.MONTHLY,
      status: GoalStatus.IN_PROGRESS,
    });

    const result = await service.create(
      'user1',
      {
        name: 'Meta teste',
        description: 'desc',
        targetAmount: 1000,
        type: GoalType.MONTHLY,
        startDate: new Date().toISOString(),
        targetDate: new Date().toISOString(),
      },
      undefined,
    );

    expect(result.id).toBe('g1');
    expect(prisma.goal.create).toHaveBeenCalled();
  });

  it('deve lançar Forbidden se usuário não tiver household', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.list('user1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deve lançar NotFound ao buscar meta inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue({
      householdId: 'house1',
    });
    prisma.goal.findFirst.mockResolvedValue(null);

    await expect(service.findOne('user1', 'g1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
