import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: () => Promise.resolve('fake_token'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
  });
  it('should register', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: '123' });

    const result = await service.register({
      email: 'a@a.com',
      password: '123456',
      name: 'Test',
      color: '#fff',
    });

    expect(result.accessToken).toBeDefined();
  });

  it('should login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '123',
      password: await bcrypt.hash('123456', 10),
    });

    const result = await service.login({
      email: 'a@a.com',
      password: '123456',
    });

    expect(result.accessToken).toBeDefined();
  });
});
