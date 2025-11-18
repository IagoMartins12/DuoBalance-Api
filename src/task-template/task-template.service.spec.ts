import { Test, TestingModule } from '@nestjs/testing';
import { TaskTemplateService } from './task-template.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createPrismaMock } from '../../test/prisma-mock';
import { TaskType, TaskWeight } from '@prisma/client';

describe('TaskTemplateService', () => {
  let service: TaskTemplateService;
  let prisma = createPrismaMock();

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      taskTemplate: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskTemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TaskTemplateService>(TaskTemplateService);
  });

  // ----------------------
  // LISTAR
  // ----------------------
  it('deve listar templates disponíveis para o usuário', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    } as any);

    prisma.taskTemplate.findMany.mockResolvedValue([
      { id: 't1', name: 'Lavar louça' },
    ] as any);

    const result = await service.findAllForUser('u1');

    expect(result).toHaveLength(1);
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.taskTemplate.findMany).toHaveBeenCalled();
  });

  it('deve falhar ao listar se usuário não pertence a uma casa', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findAllForUser('u1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ----------------------
  // CRIAÇÃO
  // ----------------------
  it('deve criar template customizado', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.create.mockResolvedValue({
      id: 't1',
      name: 'Rega plantas',
    } as any);

    const dto = {
      name: 'Rega plantas',
      type: TaskType.CLEANING,
      weight: TaskWeight.MEDIUM,
      description: '',
    };

    const created = await service.createCustom('u1', dto);

    expect(created.id).toBe('t1');
    expect(prisma.taskTemplate.create).toHaveBeenCalled();
  });

  // ----------------------
  // UPDATE
  // ----------------------
  it('deve atualizar template customizado da casa', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue({
      id: 't1',
      householdId: 'h1',
      isBuiltIn: false,
    } as any);

    prisma.taskTemplate.update.mockResolvedValue({
      id: 't1',
      name: 'Nova',
    } as any);

    const updated = await service.update('u1', 't1', {
      name: 'Nova',
    });

    expect(updated.id).toBe('t1');
    expect(prisma.taskTemplate.update).toHaveBeenCalled();
  });

  it('não deve permitir atualizar tarefa de outra casa', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue({
      id: 't1',
      householdId: 'OTHER',
      isBuiltIn: false,
    });

    await expect(service.update('u1', 't1', { name: 'teste' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('não deve permitir atualizar tarefa inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue(null);

    await expect(service.update('u1', 'invalid', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  // ----------------------
  // DELETE
  // ----------------------
  it('deve fazer soft delete de template customizado', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue({
      id: 't1',
      householdId: 'h1',
      isBuiltIn: false,
    });

    prisma.taskTemplate.update.mockResolvedValue({ id: 't1', isActive: false });

    const result = await service.softDelete('u1', 't1');

    expect(result.isActive).toBe(false);
    expect(prisma.taskTemplate.update).toHaveBeenCalled();
  });

  it('não deve permitir apagar tarefa padrão', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });

    prisma.taskTemplate.findUnique.mockResolvedValue({
      id: 't1',
      isBuiltIn: true,
      householdId: null,
    });

    await expect(service.softDelete('u1', 't1')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
