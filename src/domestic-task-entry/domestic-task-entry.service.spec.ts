import { Test, TestingModule } from '@nestjs/testing';
import { DomesticTaskEntryService } from './domestic-task-entry.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../test/prisma-mock';

describe('DomesticTaskEntryService', () => {
  let service: DomesticTaskEntryService;
  let prisma = createPrismaMock();

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      taskTemplate: { findUnique: jest.fn() },
      domesticTaskEntry: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomesticTaskEntryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DomesticTaskEntryService>(DomesticTaskEntryService);
  });

  // ----------------------
  // Create
  // ----------------------
  it('deve criar uma execução de tarefa', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue({
      id: 't1',
      isBuiltIn: true,
      householdId: null,
      isActive: true,
    });

    prisma.domesticTaskEntry.create.mockResolvedValue({
      id: 'entry1',
    } as any);

    const entry = await service.createEntry('u1', {
      templateId: 't1',
    });

    expect(entry.id).toBe('entry1');
    expect(prisma.domesticTaskEntry.create).toHaveBeenCalled();
  });

  it('não deve permitir criar execução sem household', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.createEntry('u1', { templateId: 't1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('não deve permitir usar template inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue(null);

    await expect(
      service.createEntry('u1', { templateId: 't1' }),
    ).rejects.toThrow(NotFoundException);
  });

  // ----------------------
  // List month
  // ----------------------
  it('deve listar tarefas do mês', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.domesticTaskEntry.findMany.mockResolvedValue([
      {
        id: 'e1',
      },
    ] as any);

    const list = await service.listEntriesForMonth('u1', 2025, 1);

    expect(list).toHaveLength(1);
    expect(prisma.domesticTaskEntry.findMany).toHaveBeenCalled();
  });
});
