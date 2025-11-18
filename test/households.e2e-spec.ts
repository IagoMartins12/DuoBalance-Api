/**
 * test/households.e2e-spec.ts
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Households E2E', () => {
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

  it('fluxo: criar casa, ver minha casa, segundo usuário entrar, ver membros', async () => {
    const token1 = await registerAndLogin('user1@test.com');

    const createRes = await request(app.getHttpServer())
      .post('/households')
      .set('Authorization', `Bearer ${token1}`)
      .send({ name: 'Casa João & Maria' })
      .expect(201);

    const householdId = createRes.body.id;
    const inviteCode = createRes.body.inviteCode;

    expect(inviteCode).toBeDefined();
    expect(createRes.body.members).toHaveLength(1);

    const token2 = await registerAndLogin('user2@test.com');

    const joinRes = await request(app.getHttpServer())
      .post('/households/join')
      .set('Authorization', `Bearer ${token2}`)
      .send({ inviteCode })
      .expect(201);

    expect(joinRes.body.members).toHaveLength(2);

    const meRes1 = await request(app.getHttpServer())
      .get('/households/me')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(meRes1.body.id).toBe(householdId);
    expect(meRes1.body.members).toHaveLength(2);

    await request(app.getHttpServer())
      .post('/households/leave')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);
  });
});
