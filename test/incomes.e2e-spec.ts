/**
 * test/incomes.e2e-spec.ts
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Frequency, IncomeType } from '@prisma/client';

describe('Incomes E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'testdb' },
    });

    process.env.DATABASE_URL = `${mongod.getUri()}testdb`;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  async function registerAndLogin(email: string) {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: '123456',
        name: 'User',
        color: '#fff',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: '123456',
      })
      .expect(200);

    return login.body.accessToken as string;
  }

  it('fluxo: criar casa, registrar rendas para os 2 usuários e obter resumo mensal', async () => {
    const token1 = await registerAndLogin('u1@test.com');

    const houseRes = await request(app.getHttpServer())
      .post('/households')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Casa Teste' })
      .expect(201);

    const inviteCode = houseRes.body.inviteCode;

    const token2 = await registerAndLogin('u2@test.com');

    await request(app.getHttpServer())
      .post('/households/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode })
      .expect(201);

    // user1
    await request(app.getHttpServer())
      .post('/incomes')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        source: 'Salário U1',
        amount: 3000,
        type: IncomeType.SALARY,
        frequency: Frequency.MONTHLY,
        receivedAt: '2025-11-01T00:00:00.000Z',
        isRecurring: true,
      })
      .expect(201);

    // user2
    await request(app.getHttpServer())
      .post('/incomes')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        source: 'Salário U2',
        amount: 2000,
        type: IncomeType.SALARY,
        frequency: Frequency.MONTHLY,
        receivedAt: '2025-11-05T00:00:00.000Z',
        isRecurring: true,
      })
      .expect(201);

    const summaryRes = await request(app.getHttpServer())
      .get('/incomes/summary/monthly')
      .set('Authorization', `Bearer ${token1}`)
      .query({ year: 2025, month: 11 })
      .expect(200);

    expect(summaryRes.body.totalHouseholdAmount).toBe(5000);
    expect(summaryRes.body.users.length).toBe(2);
  });
});
