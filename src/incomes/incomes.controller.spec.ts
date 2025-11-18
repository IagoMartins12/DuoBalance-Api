import { Test, TestingModule } from '@nestjs/testing';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('IncomesController', () => {
  let controller: IncomesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesController],
      providers: [
        IncomesService,
        {
          provide: PrismaService,
          useValue: {
            income: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<IncomesController>(IncomesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
