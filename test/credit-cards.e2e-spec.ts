/**
 * E2E — Credit Cards
 */

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createPrismaMock } from './prisma-mock';
import { CardBrand } from '@prisma/client';

describe('CreditCards — E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;

  // Simulação de usuário autenticado
  const authHeader = {
    Authorization: 'Bearer fake-jwt',
  };

  const mockReqUser = { id: 'u1', householdId: 'h1' };

  beforeAll(async () => {
    prisma = createPrismaMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();

    // middleware fake para req.user
    app.use((req: any, _, next) => {
      req.user = mockReqUser;
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------------------
  // POST /credit-cards
  // ------------------------------------------------------------------------------
  it('POST /credit-cards → cria cartão', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);

    prisma.creditCard.create.mockResolvedValue({
      //   id: 'card1',
      ...mockReqUser,
      name: 'Nubank',
      lastDigits: '1234',
      brand: CardBrand.VISA,
      limit: 2000,
      closingDay: 5,
      dueDay: 15,
      isActive: true,
    });

    const dto = {
      name: 'Nubank',
      lastDigits: '1234',
      brand: CardBrand.VISA,
      limit: 2000,
      closingDay: 5,
      dueDay: 15,
    };

    const res = await request(app.getHttpServer())
      .post('/credit-cards')
      .set(authHeader)
      .send(dto)
      .expect(201);

    expect(res.body.id).toBe('card1');
    expect(prisma.creditCard.create).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------------------
  // GET /credit-cards
  // ------------------------------------------------------------------------------
  it('GET /credit-cards → lista cartões com resumo', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);

    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card1',
        userId: 'u1',
        limit: 1000,
        closingDay: 10,
        dueDay: 20,
      },
    ] as any);

    prisma.installment.findMany.mockResolvedValue([
      { amount: 200 },
      { amount: 300 },
    ] as any);

    const res = await request(app.getHttpServer())
      .get('/credit-cards')
      .set(authHeader)
      .expect(200);

    expect(res.body[0].summary.currentInvoiceAmount).toBe(500);
    expect(res.body[0].summary.availableLimit).toBe(500);
  });

  // ------------------------------------------------------------------------------
  // PATCH /credit-cards/:id
  // ------------------------------------------------------------------------------
  it('PATCH /credit-cards/:id → atualiza cartão', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);
    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      name: 'Old',
    });

    prisma.creditCard.update.mockResolvedValue({
      id: 'card1',
      name: 'Novo Nome',
    });

    const res = await request(app.getHttpServer())
      .patch('/credit-cards/card1')
      .set(authHeader)
      .send({ name: 'Novo Nome' })
      .expect(200);

    expect(res.body.name).toBe('Novo Nome');
  });

  // ------------------------------------------------------------------------------
  // DELETE /credit-cards/:id
  // ------------------------------------------------------------------------------
  it('DELETE /credit-cards/:id → soft delete cartão', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      limit: 2000,
      isActive: true,
    });

    prisma.installment.findMany.mockResolvedValue([]); // nenhuma parcela aberta

    prisma.creditCard.update.mockResolvedValue({
      id: 'card1',
      isActive: false,
    });

    const res = await request(app.getHttpServer())
      .delete('/credit-cards/card1')
      .set(authHeader)
      .expect(200);

    expect(res.body.isActive).toBe(false);
  });

  // ------------------------------------------------------------------------------
  // POST /credit-cards/:id/transactions
  // ------------------------------------------------------------------------------
  it('POST /credit-cards/:id/transactions → adiciona compra', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      householdId: 'h1',
      closingDay: 10,
      dueDay: 20,
      isActive: true,
    });

    prisma.expense.create.mockResolvedValue({
      id: 'exp1',
      amount: 120,
    });

    prisma.installment.createMany.mockResolvedValue({ count: 3 });

    prisma.expense.findUnique.mockResolvedValue({
      id: 'exp1',
      amount: 120,
      installments: [
        { id: 'i1', amount: 40 },
        { id: 'i2', amount: 40 },
        { id: 'i3', amount: 40 },
      ],
    });

    const dto = {
      amount: 120,
      description: 'Mercado',
      totalInstallments: 3,
    };

    const res = await request(app.getHttpServer())
      .post('/credit-cards/card1/transactions')
      .set(authHeader)
      .send(dto)
      .expect(201);

    expect(res.body.installments.length).toBe(3);
    expect(res.body.id).toBe('exp1');
  });

  // ------------------------------------------------------------------------------
  // PATCH /credit-cards/:id/transactions/:installmentId/pay
  // ------------------------------------------------------------------------------
  it('PATCH /credit-cards/:id/transactions/:installmentId/pay → paga parcela', async () => {
    prisma.user.findUnique.mockResolvedValue(mockReqUser);

    prisma.creditCard.findFirst.mockResolvedValue({
      id: 'card1',
      userId: 'u1',
      isActive: true,
    });

    prisma.installment.findFirst.mockResolvedValue({
      id: 'i1',
      isPaid: false,
      expense: {
        creditCardId: 'card1',
        householdId: 'h1',
      },
    });

    prisma.installment.update.mockResolvedValue({
      id: 'i1',
      isPaid: true,
    });

    const dto = {
      paidAt: new Date().toISOString(),
    };

    const res = await request(app.getHttpServer())
      .patch('/credit-cards/card1/transactions/i1/pay')
      .set(authHeader)
      .send(dto)
      .expect(200);

    expect(res.body.isPaid).toBe(true);
  });
});
