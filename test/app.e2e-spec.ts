import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    // IMPORTANTE — DEFINIR DATABASE NAME
    mongod = await MongoMemoryServer.create({
      instance: { dbName: 'testdb' },
    });

    process.env.DATABASE_URL = `${mongod.getUri()}testdb`;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it('GET / should return 404 since base route does not exist', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });
});
