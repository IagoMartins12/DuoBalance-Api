import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const service = {
    listForUser: jest.fn(),
    markAsRead: jest.fn(),
  };

  const req = { user: { id: 'u1' } } as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    controller = module.get(NotificationsController);

    jest.clearAllMocks();
  });

  it('list', async () => {
    service.listForUser.mockResolvedValue([{ id: 'n1' }]);

    const res = await controller.list(req);
    expect(res).toHaveLength(1);
  });

  it('mark read', async () => {
    service.markAsRead.mockResolvedValue({ id: 'n1' });

    const res = await controller.markAsRead(req, 'n1');
    expect(res.id).toBe('n1');
  });
});
