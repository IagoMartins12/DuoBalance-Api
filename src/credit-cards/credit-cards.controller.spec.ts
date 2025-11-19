import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardsController } from './credit-cards.controller';
import { CreditCardsService } from './credit-cards.service';

describe('CreditCardsController', () => {
  let controller: CreditCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardsController],
      providers: [
        {
          provide: CreditCardsService,
          useValue: {
            createCard: jest.fn(),
            listCards: jest.fn(),
            updateCard: jest.fn(),
            softDeleteCard: jest.fn(),
            addTransaction: jest.fn(),
            payInstallment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CreditCardsController>(CreditCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
