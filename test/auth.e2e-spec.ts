/**
 * test/auth.e2e-spec.ts
 * Testes E2E para autenticação
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Auth E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // 🚀 INICIAR MONGO IN-MEMORY COM dbName DEFINIDO (ESSENCIAL)
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'testdb' },
    });

    process.env.DATABASE_URL = `${mongod.getUri()}testdb`;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

    // Validações globais iguais ao ambiente real
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongod) await mongod.stop();
  });

  // 🧪 ------------------------- TESTES -------------------------

  it('/auth/register → cria usuário e retorna token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@test.com',
        password: '123456',
        name: 'Test',
        color: '#fff',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('/auth/login → retorna token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@test.com',
        password: '123456',
      })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
  });
});
