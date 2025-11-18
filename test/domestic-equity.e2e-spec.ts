import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DomesticEquity (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/domestic-equity/monthly (GET) deve exigir auth', async () => {
    const res = await request(app.getHttpServer()).get(
      '/domestic-equity/monthly?year=2025&month=1',
    );

    // dependendo da sua config global de guard, pode ser 401
    expect([401, 403]).toContain(res.status);
  });

  afterAll(async () => {
    await app.close();
  });
});
