import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

// Mock para evitar upload real
const cloudinaryMock = {
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://fake.cloudinary.com/test.jpg',
    publicId: 'fake123',
  }),
};

// Gerar token mock (você já deve ter isso num helper)
function fakeAuth() {
  return { Authorization: `Bearer test-user-token` };
}

describe('Goals & Dreams (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryService)
      .useValue(cloudinaryMock)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  // --------------------------
  // CREATE GOAL
  // --------------------------
  it('POST /goals - deve criar uma meta', async () => {
    const res = await request(app.getHttpServer())
      .post('/goals')
      .set(fakeAuth())
      .field('name', 'Meta Teste')
      .field('description', 'Descrição aqui')
      .field('targetAmount', '500')
      .field('type', 'MONTHLY')
      .field('startDate', new Date().toISOString())
      .field('targetDate', new Date().toISOString());

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  // --------------------------
  // LIST GOALS
  // --------------------------
  it('GET /goals - deve listar metas', async () => {
    const res = await request(app.getHttpServer())
      .get('/goals')
      .set(fakeAuth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --------------------------
  // CREATE DREAM
  // --------------------------
  it('POST /dreams - deve criar um sonho', async () => {
    const res = await request(app.getHttpServer())
      .post('/dreams')
      .set(fakeAuth())
      .field('name', 'Viagem sonhada')
      .field('description', 'Paris')
      .field('targetAmount', '12000')
      .field('priority', 'HIGH');

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  // --------------------------
  // LIST DREAMS
  // --------------------------
  it('GET /dreams - deve listar sonhos', async () => {
    const res = await request(app.getHttpServer())
      .get('/dreams')
      .set(fakeAuth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  afterAll(async () => {
    await app.close();
  });
});
