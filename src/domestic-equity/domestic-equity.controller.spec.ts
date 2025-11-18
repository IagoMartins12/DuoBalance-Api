import { Test, TestingModule } from '@nestjs/testing';
import { DomesticEquityController } from './domestic-equity.controller';
import { DomesticEquityService } from './domestic-equity.service';

describe('DomesticEquityController', () => {
  let controller: DomesticEquityController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: DomesticEquityService;

  const mockService = {
    getMonthlyDomesticEquity: jest.fn(),
  };

  const mockReq = {
    user: { id: 'u1' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomesticEquityController],
      providers: [{ provide: DomesticEquityService, useValue: mockService }],
    }).compile();

    controller = module.get<DomesticEquityController>(DomesticEquityController);
    service = module.get<DomesticEquityService>(DomesticEquityService);
  });

  it('GET /domestic-equity/monthly', async () => {
    mockService.getMonthlyDomesticEquity.mockResolvedValue({
      user1Points: 10,
      user2Points: 5,
    });

    const result = await controller.getMonthly(mockReq, '2025', '1');

    expect(result.user1Points).toBe(10);
    expect(mockService.getMonthlyDomesticEquity).toHaveBeenCalledWith(
      'u1',
      2025,
      1,
    );
  });
});
