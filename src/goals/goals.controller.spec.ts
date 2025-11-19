import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { DreamsService } from './dreams.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { DreamsController } from './dreams.controller';

describe('GoalsController', () => {
  let controller: GoalsController;
  let goalsService: any;
  let cloudinary: any;

  beforeEach(async () => {
    goalsService = {
      create: jest.fn(),
      list: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addContribution: jest.fn(),
      smartSuggestions: jest.fn(),
    };
    cloudinary = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        { provide: GoalsService, useValue: goalsService },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    controller = module.get<GoalsController>(GoalsController);
  });

  it('deve listar metas', async () => {
    const req: any = { user: { id: 'user1' } };
    goalsService.list.mockResolvedValue([{ id: 'g1' }]);

    const res = await controller.listGoals(req);
    expect(res[0].id).toBe('g1');
    expect(goalsService.list).toHaveBeenCalledWith('user1');
  });
});

describe('DreamsController', () => {
  let controller: DreamsController;
  let dreamsService: any;
  let cloudinary: any;

  beforeEach(async () => {
    dreamsService = {
      create: jest.fn(),
      list: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addContribution: jest.fn(),
    };
    cloudinary = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DreamsController],
      providers: [
        { provide: DreamsService, useValue: dreamsService },
        { provide: CloudinaryService, useValue: cloudinary },
      ],
    }).compile();

    controller = module.get<DreamsController>(DreamsController);
  });

  it('deve listar sonhos', async () => {
    const req: any = { user: { id: 'user1' } };
    dreamsService.list.mockResolvedValue([{ id: 'd1' }]);

    const res = await controller.listDreams(req);
    expect(res[0].id).toBe('d1');
    expect(dreamsService.list).toHaveBeenCalledWith('user1');
  });
});
