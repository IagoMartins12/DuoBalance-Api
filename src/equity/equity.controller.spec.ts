import { Test, TestingModule } from '@nestjs/testing';
import { EquityController } from './equity.controller';
import { EquityService } from './equity.service';
import { PrismaService } from '../prisma/prisma.service';
import { SplitService } from '../split/split.service';
import { createPrismaMock } from '../../test/prisma-mock';

describe('EquityController', () => {
  let controller: EquityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquityController],
      providers: [
        EquityService,
        SplitService, // necessário
        { provide: PrismaService, useValue: createPrismaMock() },
      ],
    }).compile();

    controller = module.get<EquityController>(EquityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
