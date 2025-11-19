import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { createPrismaMock } from './prisma-mock';

describe('Notifications E2E', () => {
  let app: INestApplication;
  const prisma = createPrismaMock();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = module.createNestApplication();

    // fake login
    app.use((req: any, _res, next) => {
      req.user = { id: 'u1', householdId: 'h1' };
      next();
    });

    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /notifications', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);

    await request(app.getHttpServer())
      .get('/notifications')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBe(1);
      });
  });

  it('PATCH /notifications/:id/read', async () => {
    prisma.notification.findUnique.mockResolvedValue({ id: 'n1' });
    prisma.notification.update.mockResolvedValue({
      id: 'n1',
      readAt: new Date(),
    });

    await request(app.getHttpServer())
      .patch('/notifications/n1/read')
      .expect(200);
  });
});
