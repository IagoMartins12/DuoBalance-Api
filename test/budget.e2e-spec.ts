import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createPrismaMock } from './prisma-mock';
import { ExpenseCategory } from '@prisma/client';

describe('Budget E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;

  const authHeader = {
    Authorization: 'Bearer fake-jwt',
  };

  const mockReqUser = {
    id: 'u1',
    householdId: 'h1',
  };

  beforeAll(async () => {
    prisma = createPrismaMock();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();

    // injeta req.user
    app.use((req: any, _res, next) => {
      req.user = mockReqUser;
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------
  // POST /budgets
  // -----------------------------
  it('POST /budgets → cria orçamento', async () => {
    prisma.user.findUnique.mockResolvedValue({ householdId: 'h1' });

    prisma.budget.findUnique.mockResolvedValue(null);

    prisma.expense.findMany.mockResolvedValue([
      { amount: 100 },
      { amount: 50 },
    ] as any); // spent = 150

    prisma.budget.create.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
      category: ExpenseCategory.GROCERIES,
      amount: 300,
      month: 1,
      year: 2025,
      spent: 150,
      percentage: 50,
    } as any);

    const dto = {
      category: ExpenseCategory.GROCERIES,
      amount: 300,
      month: 1,
      year: 2025,
    };

    const res = await request(app.getHttpServer())
      .post('/budgets')
      .set(authHeader)
      .send(dto)
      .expect(201);

    expect(res.body.id).toBe('b1');
    expect(res.body.spent).toBe(150);
    expect(res.body.percentage).toBe(50);
  });

  // -----------------------------
  // GET /budgets?month=&year=
  // -----------------------------
  it('GET /budgets → lista orçamentos do mês', async () => {
    prisma.user.findUnique.mockResolvedValue({ householdId: 'h1' });

    prisma.budget.findMany.mockResolvedValue([
      {
        id: 'b1',
        category: ExpenseCategory.GROCERIES,
        amount: 300,
        month: 1,
        year: 2025,
        spent: 150,
        percentage: 50,
      },
    ] as any);

    const res = await request(app.getHttpServer())
      .get('/budgets')
      .query({ month: 1, year: 2025 })
      .set(authHeader)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('b1');
  });

  // -----------------------------
  // PATCH /budgets/:id
  // -----------------------------
  it('PATCH /budgets/:id → atualiza orçamento', async () => {
    prisma.user.findUnique.mockResolvedValue({ householdId: 'h1' });

    prisma.budget.findFirst.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
      category: ExpenseCategory.GROCERIES,
      amount: 300,
      month: 1,
      year: 2025,
    } as any);

    prisma.expense.findMany.mockResolvedValue([{ amount: 200 }] as any); // spent = 200

    prisma.budget.update.mockResolvedValue({
      id: 'b1',
      amount: 400,
      spent: 200,
      percentage: 50,
    } as any);

    const res = await request(app.getHttpServer())
      .patch('/budgets/b1')
      .set(authHeader)
      .send({ amount: 400 })
      .expect(200);

    expect(res.body.amount).toBe(400);
    expect(res.body.spent).toBe(200);
    expect(res.body.percentage).toBe(50);
  });

  // -----------------------------
  // DELETE /budgets/:id
  // -----------------------------
  it('DELETE /budgets/:id → remove orçamento', async () => {
    prisma.user.findUnique.mockResolvedValue({ householdId: 'h1' });

    prisma.budget.findFirst.mockResolvedValue({
      id: 'b1',
      householdId: 'h1',
    } as any);

    prisma.budget.delete.mockResolvedValue({
      id: 'b1',
    } as any);

    const res = await request(app.getHttpServer())
      .delete('/budgets/b1')
      .set(authHeader)
      .expect(200);

    expect(res.body).toEqual({ deleted: true });
  });
});
