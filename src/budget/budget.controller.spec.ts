import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { ExpenseCategory } from '@prisma/client';

describe('BudgetController', () => {
  let controller: BudgetController;
  let service: BudgetService;

  const mockService = {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockReq = {
    user: { id: 'u1' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: BudgetService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BudgetController>(BudgetController);
    service = module.get<BudgetService>(BudgetService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deve chamar service.create no POST /budgets', async () => {
    const dto = {
      category: ExpenseCategory.GROCERIES,
      amount: 500,
      month: 1,
      year: 2025,
    };

    mockService.create.mockResolvedValue({ id: 'b1' });

    const result = await controller.create(mockReq, dto as any);

    expect(result).toEqual({ id: 'b1' });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });

  it('deve chamar service.list no GET /budgets', async () => {
    mockService.list.mockResolvedValue([{ id: 'b1' }]);

    const result = await controller.list(mockReq, '1', '2025');

    expect(result).toEqual([{ id: 'b1' }]);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.list).toHaveBeenCalledWith('u1', 1, 2025);
  });

  it('deve chamar service.update no PATCH /budgets/:id', async () => {
    mockService.update.mockResolvedValue({ id: 'b1', amount: 800 });

    const result = await controller.update(mockReq, 'b1', {
      amount: 800,
    } as any);

    expect(result).toEqual({ id: 'b1', amount: 800 });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.update).toHaveBeenCalledWith('u1', 'b1', { amount: 800 });
  });

  it('deve chamar service.delete no DELETE /budgets/:id', async () => {
    mockService.delete.mockResolvedValue({ deleted: true });

    const result = await controller.delete(mockReq, 'b1');

    expect(result).toEqual({ deleted: true });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(service.delete).toHaveBeenCalledWith('u1', 'b1');
  });
});
