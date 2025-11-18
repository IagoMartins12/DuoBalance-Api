import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { startInMemoryMongo, stopInMemoryMongo } from './mongo-memory-server';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

describe('Expenses E2E', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    await startInMemoryMongo();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await stopInMemoryMongo();
  });

  // ---------------------------------------------------------
  // Helper para registrar usuário, logar e criar household
  // ---------------------------------------------------------
  async function createUserAndHousehold(email: string) {
    // register
    await request(server)
      .post('/auth/register')
      .send({
        email,
        password: '123456',
        name: 'Test User',
        color: '#fff',
      })
      .expect(201);

    // login
    const login = await request(server)
      .post('/auth/login')
      .send({ email, password: '123456' })
      .expect(200);

    const token = login.body.accessToken;

    // criar household
    const household = await request(server)
      .post('/households')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Casa Teste' })
      .expect(201);

    return { token, householdId: household.body.id };
  }

  // ---------------------------------------------------------
  // 🔹 Teste 1 — Criar despesa individual
  // ---------------------------------------------------------
  it('deve criar uma despesa individual com sucesso', async () => {
    const { token } = await createUserAndHousehold('u1@test.com');

    const res = await request(server)
      .post('/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Mercado',
        amount: 120,
        category: ExpenseCategory.GROCERIES,
        date: new Date().toISOString(),
        paymentMethod: PaymentMethod.PIX,
        isIndividual: true,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });

  // ---------------------------------------------------------
  // 🔹 Teste 2 — Criar despesa parcelada (com cartão)
  // ---------------------------------------------------------
  it('deve criar despesa parcelada e gerar parcelas', async () => {
    const { token } = await createUserAndHousehold('u2@test.com');

    // cria cartão
    const card = await request(server)
      .post('/credit-cards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Visa Test',
        lastDigits: '1234',
        brand: 'VISA',
        limit: 5000,
        closingDay: 5,
        dueDay: 15,
      })
      .expect(201);

    const res = await request(server)
      .post('/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Notebook parcelado',
        amount: 3000,
        category: ExpenseCategory.OTHER,
        date: new Date().toISOString(),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        creditCardId: card.body.id,
        isInstallment: true,
        totalInstallments: 3,
        firstDueDate: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
  });

  // ---------------------------------------------------------
  // 🔹 Teste 3 — Cartão inválido
  // ---------------------------------------------------------
  it('deve retornar erro ao usar cartão inexistente', async () => {
    const { token } = await createUserAndHousehold('u3@test.com');

    await request(server)
      .post('/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Compra X',
        amount: 200,
        category: ExpenseCategory.GROCERIES,
        date: new Date().toISOString(),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        creditCardId: 'inexistente',
      })
      .expect(404);
  });

  // ---------------------------------------------------------
  // 🔹 Teste 4 — User não pode editar despesa de outro user
  // ---------------------------------------------------------
  it('não deve permitir editar despesa criada por outro usuário', async () => {
    const { token: t1 } = await createUserAndHousehold('u4@test.com');
    const { token: t2 } = await createUserAndHousehold('u5@test.com');

    // u4 cria uma expense
    const expense = await request(server)
      .post('/expenses')
      .set('Authorization', `Bearer ${t1}`)
      .send({
        description: 'Cinema',
        amount: 50,
        category: ExpenseCategory.LEISURE,
        date: new Date().toISOString(),
        paymentMethod: PaymentMethod.PIX,
      })
      .expect(201);

    // u5 tenta editar e deve falhar
    await request(server)
      .patch(`/expenses/${expense.body.id}`)
      .set('Authorization', `Bearer ${t2}`)
      .send({ description: 'Cinema alterado' })
      .expect(403);
  });

  // ---------------------------------------------------------
  // 🔹 Teste 5 — User não pode excluir despesa de outro user
  // ---------------------------------------------------------
  it('não deve permitir excluir despesa criada por outro usuário', async () => {
    const { token: t1 } = await createUserAndHousehold('u6@test.com');
    const { token: t2 } = await createUserAndHousehold('u7@test.com');

    const expense = await request(server)
      .post('/expenses')
      .set('Authorization', `Bearer ${t1}`)
      .send({
        description: 'Restaurante',
        amount: 90,
        category: ExpenseCategory.RESTAURANTS,
        date: new Date().toISOString(),
        paymentMethod: PaymentMethod.PIX,
      })
      .expect(201);

    await request(server)
      .delete(`/expenses/${expense.body.id}`)
      .set('Authorization', `Bearer ${t2}`)
      .expect(403);
  });
});
