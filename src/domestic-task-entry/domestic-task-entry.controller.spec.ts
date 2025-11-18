import { Test, TestingModule } from '@nestjs/testing';
import { DomesticTaskEntryController } from './domestic-task-entry.controller';
import { DomesticTaskEntryService } from './domestic-task-entry.service';

describe('DomesticTaskEntryController', () => {
  let controller: DomesticTaskEntryController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: DomesticTaskEntryService;

  const mockService = {
    createEntry: jest.fn(),
    listEntriesForMonth: jest.fn(),
  };

  const mockReq = {
    user: { id: 'u1' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomesticTaskEntryController],
      providers: [{ provide: DomesticTaskEntryService, useValue: mockService }],
    }).compile();

    controller = module.get<DomesticTaskEntryController>(
      DomesticTaskEntryController,
    );
    service = module.get<DomesticTaskEntryService>(DomesticTaskEntryService);
  });

  it('POST /domestic-tasks', async () => {
    mockService.createEntry.mockResolvedValue({ id: 'entry1' });

    const dto = { templateId: 't1' };

    const result = await controller.create(mockReq, dto);

    expect(result).toEqual({ id: 'entry1' });
    expect(mockService.createEntry).toHaveBeenCalledWith('u1', dto);
  });

  it('GET /domestic-tasks', async () => {
    mockService.listEntriesForMonth.mockResolvedValue([{ id: 'e1' }]);

    const result = await controller.list(mockReq, '2025', '1');

    expect(result).toEqual([{ id: 'e1' }]);
    expect(mockService.listEntriesForMonth).toHaveBeenCalledWith('u1', 2025, 1);
  });
});
