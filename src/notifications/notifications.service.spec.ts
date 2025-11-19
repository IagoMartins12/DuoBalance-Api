import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/prisma-mock';
describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('should list notifications for user', async () => {
    prisma.notification.findMany.mockResolvedValue([{ id: '1' }]);

    const result = await service.listForUser('user1');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('should mark as read', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: '1',
      userId: 'user1',
    });

    prisma.notification.update.mockResolvedValue({
      id: '1',
      isRead: true,
    });

    const result = await service.markAsRead('user1', '1');
    expect(result).toEqual({ id: '1', isRead: true });
  });
});
