/**
 * test/users.e2e-spec.ts
 */

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

interface LoginResponse {
  accessToken: string;
}

interface MeResponse {
  email: string;
  name: string;
  color: string;
}

describe('Users E2E', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'testdb' },
    });

    process.env.DATABASE_URL = `${mongod.getUri()}testdb`;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('/auth/register + /auth/login + /users/me', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/auth/register')
      .send({
        email: 'test@test.com',
        password: '123456',
        name: 'Test',
        color: '#fff',
      })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .send({
        email: 'test@test.com',
        password: '123456',
      })
      .expect(200);

    const token = (login.body as LoginResponse).accessToken;

    const me = await request(server)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = me.body as MeResponse;

    expect(body.email).toBe('test@test.com');
  });
});
