import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('deve criar usuário', async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'a@a.com',
    });

    const result = await service.create({
      email: 'a@a.com',
      password: '123456',
      name: 'Test',
      color: '#fff',
    });

    expect(result.id).toBe('1');
  });

  it('deve buscar por email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
    });

    const result = await service.findByEmail('a@a.com');

    expect(result?.id).toBe('1');
  });
});
