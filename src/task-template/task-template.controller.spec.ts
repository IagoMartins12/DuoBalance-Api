import { Test, TestingModule } from '@nestjs/testing';
import { TaskTemplateController } from './task-template.controller';
import { TaskTemplateService } from './task-template.service';
import { TaskType, TaskWeight } from '@prisma/client';

describe('TaskTemplateController', () => {
  let controller: TaskTemplateController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: TaskTemplateService;

  const mockService = {
    findAllForUser: jest.fn(),
    createCustom: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'u1' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskTemplateController],
      providers: [{ provide: TaskTemplateService, useValue: mockService }],
    }).compile();

    controller = module.get<TaskTemplateController>(TaskTemplateController);
    service = module.get<TaskTemplateService>(TaskTemplateService);
  });

  it('GET /task-templates', async () => {
    mockService.findAllForUser.mockResolvedValue([{ id: 't1' }]);

    const result = await controller.findAll(mockRequest);

    expect(result).toEqual([{ id: 't1' }]);
    expect(mockService.findAllForUser).toHaveBeenCalledWith('u1');
  });

  it('POST /task-templates', async () => {
    mockService.createCustom.mockResolvedValue({ id: 't1' });

    const dto = {
      name: 'Louça',
      type: TaskType.DISHES,
      weight: TaskWeight.MEDIUM,
    };

    const result = await controller.create(mockRequest, dto);

    expect(result).toEqual({ id: 't1' });
    expect(mockService.createCustom).toHaveBeenCalled();
  });

  it('PATCH /task-templates/:id', async () => {
    mockService.update.mockResolvedValue({ id: 't1' });

    const result = await controller.update(mockRequest, 't1', { name: 'Nova' });

    expect(result).toEqual({ id: 't1' });
    expect(mockService.update).toHaveBeenCalled();
  });

  it('DELETE /task-templates/:id', async () => {
    mockService.softDelete.mockResolvedValue({ success: true });

    const result = await controller.remove(mockRequest, 't1');

    expect(result).toEqual({ success: true });
    expect(mockService.softDelete).toHaveBeenCalled();
  });
});
