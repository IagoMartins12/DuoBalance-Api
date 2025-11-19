import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // -----------------------------------------------------
  // CREATE (genérico — usado pelos módulos)
  // -----------------------------------------------------
  async create(dto: CreateNotificationDto) {
    if (!dto.userId || !dto.householdId) {
      throw new ForbiddenException('householdId e userId são obrigatórios');
    }

    return this.prisma.notification.create({
      data: {
        householdId: dto.householdId,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        relatedId: dto.relatedId ?? null,
        relatedType: dto.relatedType ?? null,
      },
    });
  }

  // -----------------------------------------------------
  // LIST — lista notificações do usuário
  // -----------------------------------------------------
  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -----------------------------------------------------
  // MARK AS READ — marca como lida
  // -----------------------------------------------------
  async markAsRead(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw new NotFoundException('Notificação não encontrada');
    }

    if (notif.userId !== userId) {
      throw new ForbiddenException('Você não pode alterar esta notificação');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // -----------------------------------------------------
  // BUDGET NOTIFICATIONS (helper chamado pelo BudgetService)
  // -----------------------------------------------------
  async emitBudgetNotification(payload: {
    householdId: string;
    budgetId: string;
    type: 'BUDGET_WARNING' | 'BUDGET_CRITICAL';
    spent: number;
    amount: number;
  }) {
    const { householdId, budgetId, type, spent, amount } = payload;

    // Buscar usuários da casa
    const members = await this.prisma.user.findMany({
      where: { householdId },
      select: { id: true },
    });

    // Criar para cada membro
    for (const member of members) {
      await this.prisma.notification.create({
        data: {
          householdId,
          userId: member.id,
          type,
          title:
            type === 'BUDGET_WARNING'
              ? 'Aviso de orçamento'
              : 'Orçamento ultrapassado',
          message:
            type === 'BUDGET_WARNING'
              ? `O orçamento está em ${spent}/${amount} (acima de 80%).`
              : `O orçamento foi ultrapassado: ${spent}/${amount}.`,
          relatedId: budgetId,
          relatedType: 'BUDGET',
        },
      });
    }
  }
}
