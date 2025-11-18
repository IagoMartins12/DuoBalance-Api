import { Test } from '@nestjs/testing';
import { HouseholdsService } from './households.service';
import { PrismaService } from '../prisma/prisma.service';
import { SplitMethod } from '@prisma/client';

describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let prisma: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(), // <- este é o mock que queremos rastrear
              count: jest.fn(),
            },

            household: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },

            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(HouseholdsService);
    prisma = module.get(PrismaService);
  });

  it('deve criar casa e vincular usuário quando dados estiverem válidos', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: null,
    });

    prisma.household.findFirst.mockResolvedValue(null);

    // usado após o createHousehold
    prisma.household.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'Casa Válida',
      inviteCode: 'ABC123',
      splitMethod: SplitMethod.FIFTY_FIFTY,
      members: [],
    });

    // 🔥 Aqui está a correção definitiva
    prisma.$transaction.mockImplementation((callback) => {
      return callback({
        household: {
          create: jest.fn().mockResolvedValue({
            id: 'h1',
            name: 'Casa Válida',
            inviteCode: 'ABC123',
            splitMethod: SplitMethod.FIFTY_FIFTY,
          }),
        },
        // ❗ APONTE O TX PARA O msm mock externo
        user: {
          update: prisma.user.update,
        },
      });
    });

    const result = await service.createHousehold('u1', {
      name: 'Casa Válida',
      splitMethod: SplitMethod.FIFTY_FIFTY,
    });

    // validações
    expect(result.id).toBe('h1');
    expect(result.members).toEqual([]);

    // 🔥 Este agora passa
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
