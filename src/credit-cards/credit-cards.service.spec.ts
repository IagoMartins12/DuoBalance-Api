import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardsService } from './credit-cards.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/prisma-mock';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CardBrand } from '@prisma/client';

describe('CreditCardsService', () => {
  let service: CreditCardsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditCardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CreditCardsService>(CreditCardsService);
  });

  // Helper para usuário logado com household
  function mockUserWithHousehold() {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      householdId: 'h1',
    });
  }

  // --------------------
  // createCard
  // --------------------
  it('deve criar um cartão de crédito', async () => {
    mockUserWithHousehold();

    prisma.creditCard.create.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      name: 'Nubank Roxo',
      lastDigits: '1234',
      brand: CardBrand.VISA,
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      color: '#8000ff',
      isActive: true,
    } as any);

    const dto = {
      name: 'Nubank Roxo',
      lastDigits: '1234',
      brand: CardBrand.VISA,
      limit: 2000,
      closingDay: 10,
      dueDay: 20,
      color: '#8000ff',
    };

    const result = await service.createCard('u1', dto);

    expect(result.id).toBe('card1');
    expect(prisma.creditCard.create).toHaveBeenCalled();
  });

  it('deve lançar Forbidden se usuário não tem household ao criar cartão', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.createCard('u1', {
        name: 'Teste',
        lastDigits: '0000',
        brand: CardBrand.VISA,
        limit: 1000,
        closingDay: 5,
        dueDay: 15,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // --------------------
  // listCards
  // --------------------
  it('deve listar cartões com resumo de fatura e limite disponível', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card1',
        userId: 'u1',
        limit: 2000,
        closingDay: 10,
        dueDay: 20,
      },
    ] as any);

    prisma.installment.findMany.mockResolvedValue([
      { amount: 500 },
      { amount: 300 },
    ] as any);

    const result = await service.listCards('u1');

    expect(result).toHaveLength(1);
    expect(result[0].summary.currentInvoiceAmount).toBe(800);
    expect(result[0].summary.availableLimit).toBe(1200);
  });

  // --------------------
  // updateCard
  // --------------------
  it('deve atualizar o cartão se for do usuário', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      name: 'Old',
      lastDigits: '1111',
      brand: CardBrand.VISA,
      limit: 1000,
      closingDay: 5,
      dueDay: 10,
      color: null,
      isActive: true,
    } as any);

    prisma.creditCard.update.mockResolvedValue({
      id: 'card1',
      name: 'Novo Nome',
    } as any);

    const updated = await service.updateCard('u1', 'card1', {
      name: 'Novo Nome',
    });

    expect(updated.name).toBe('Novo Nome');
    expect(prisma.creditCard.update).toHaveBeenCalled();
  });

  it('deve lançar NotFound ao atualizar cartão inexistente', async () => {
    mockUserWithHousehold();
    prisma.creditCard.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCard('u1', 'card-x', { name: 'Teste' }),
    ).rejects.toThrow(NotFoundException);
  });

  // --------------------
  // softDeleteCard
  // --------------------
  it('deve desativar cartão sem fatura em aberto', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      limit: 2000,
      isActive: true,
    } as any);

    // getCardSummary -> installments.sum = 0
    prisma.installment.findMany.mockResolvedValue([] as any);

    prisma.creditCard.update.mockResolvedValue({
      id: 'card1',
      isActive: false,
    } as any);

    const result = await service.softDeleteCard('u1', 'card1');

    expect(result.isActive).toBe(false);
  });

  it('não deve desativar cartão com fatura em aberto', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      limit: 2000,
      isActive: true,
    } as any);

    prisma.installment.findMany.mockResolvedValue([{ amount: 500 }] as any);

    await expect(service.softDeleteCard('u1', 'card1')).rejects.toThrow(
      BadRequestException,
    );
  });

  // --------------------
  // addTransaction
  // --------------------
  it('deve criar compra à vista (1 parcela)', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      closingDay: 10,
      dueDay: 20,
      isActive: true,
    } as any);

    prisma.expense.create.mockResolvedValue({
      id: 'exp1',
      amount: 100,
    } as any);

    prisma.installment.createMany.mockResolvedValue({ count: 1 } as any);

    prisma.expense.findUnique.mockResolvedValue({
      id: 'exp1',
      amount: 100,
      installments: [
        {
          id: 'inst1',
          amount: 100,
        },
      ],
    } as any);

    const dto = {
      amount: 100,
      description: 'Supermercado',
      totalInstallments: 1,
    };

    const result = await service.addTransaction('u1', 'card1', dto);

    expect(result?.id).toBe('exp1');
    expect(result?.installments).toHaveLength(1);
    expect(prisma.expense.create).toHaveBeenCalled();
    expect(prisma.installment.createMany).toHaveBeenCalled();
  });

  it('deve lançar erro se valor da compra for <= 0', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      isActive: true,
      closingDay: 10,
      dueDay: 20,
    } as any);

    await expect(
      service.addTransaction('u1', 'card1', {
        amount: 0,
        description: 'Invalida',
        totalInstallments: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve lançar NotFound ao adicionar compra em cartão inexistente', async () => {
    mockUserWithHousehold();
    prisma.creditCard.findFirst.mockResolvedValue(null);

    await expect(
      service.addTransaction('u1', 'card1', {
        amount: 100,
        description: 'Teste',
        totalInstallments: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // --------------------
  // payInstallment
  // --------------------
  it('deve marcar parcela como paga', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      isActive: true,
    } as any);

    prisma.installment.findFirst.mockResolvedValue({
      id: 'inst1',
      isPaid: false,
      expense: {
        creditCardId: 'card1',
        householdId: 'h1',
      },
    } as any);

    prisma.installment.update.mockResolvedValue({
      id: 'inst1',
      isPaid: true,
    } as any);

    const result = await service.payInstallment('u1', 'card1', 'inst1', {
      paidAt: '2025-01-10T00:00:00.000Z',
    });

    expect(result.isPaid).toBe(true);
    expect(prisma.installment.update).toHaveBeenCalled();
  });

  it('não deve marcar como paga parcela inexistente', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      isActive: true,
    } as any);

    prisma.installment.findFirst.mockResolvedValue(null);

    await expect(
      service.payInstallment('u1', 'card1', 'inst-x', {
        paidAt: '2025-01-10T00:00:00.000Z',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('não deve marcar como paga parcela já paga', async () => {
    mockUserWithHousehold();

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      isActive: true,
    } as any);

    prisma.installment.findFirst.mockResolvedValue({
      id: 'inst1',
      isPaid: true,
      expense: {
        creditCardId: 'card1',
        householdId: 'h1',
      },
    } as any);

    await expect(
      service.payInstallment('u1', 'card1', 'inst1', {
        paidAt: '2025-01-10T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
