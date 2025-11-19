import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import {
  GoalStatus,
  DreamStatus,
  NotificationType,
  NotificationEntity,
} from '@prisma/client';

@Injectable()
export class ContributionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------
  // Contribuir para uma META (Goal)
  // ------------------------------------------
  async contributeToGoal(
    userId: string,
    goalId: string,
    dto: CreateContributionDto,
  ) {
    const { amount, note } = dto;

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Valor da contribuição deve ser maior que zero',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        householdId: user.householdId,
      },
    });

    if (!goal) {
      throw new NotFoundException('Meta não encontrada');
    }

    // Cria contribuição
    await this.prisma.contribution.create({
      data: {
        goalId,
        amount,
        date: new Date(),
        note,
      },
    });

    // Recalcula total de contribuições
    const total = await this.prisma.contribution.aggregate({
      _sum: { amount: true },
      where: { goalId },
    });

    const newCurrentAmount = total._sum.amount ?? 0;
    const percentage = (newCurrentAmount / goal.targetAmount) * 100;

    // Atualiza meta
    const updatedStatus =
      percentage >= 100 ? GoalStatus.COMPLETED : goal.status;

    const updatedGoal = await this.prisma.goal.update({
      where: { id: goal.id },
      data: {
        currentAmount: newCurrentAmount,
        status: updatedStatus,
        completedAt:
          updatedStatus === GoalStatus.COMPLETED && !goal.completedAt
            ? new Date()
            : goal.completedAt,
      },
    });

    // Notificações inteligentes
    await this.handleGoalNotifications(
      user.householdId,
      updatedGoal.id,
      updatedGoal.name,
      percentage,
    );

    // Insight da IA (exemplo simples: quando passa de 50% e quando conclui)
    await this.maybeGenerateGoalInsight(userId, updatedGoal, percentage);

    return updatedGoal;
  }

  // ------------------------------------------
  // Contribuir para um SONHO (Dream)
  // ------------------------------------------
  async contributeToDream(
    userId: string,
    dreamId: string,
    dto: CreateContributionDto,
  ) {
    const { amount, note } = dto;

    if (!amount || amount <= 0) {
      throw new BadRequestException(
        'Valor da contribuição deve ser maior que zero',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    const dream = await this.prisma.dream.findFirst({
      where: {
        id: dreamId,
        householdId: user.householdId,
      },
    });

    if (!dream) {
      throw new NotFoundException('Sonho não encontrado');
    }

    // Cria contribuição
    await this.prisma.contribution.create({
      data: {
        dreamId,
        amount,
        date: new Date(),
        note,
      },
    });

    // Recalcula total de contribuições
    const total = await this.prisma.contribution.aggregate({
      _sum: { amount: true },
      where: { dreamId },
    });

    const newCurrentAmount = total._sum.amount ?? 0;
    const percentage = (newCurrentAmount / dream.targetAmount) * 100;

    const updatedStatus =
      percentage >= 100 ? DreamStatus.COMPLETED : dream.status;

    const updatedDream = await this.prisma.dream.update({
      where: { id: dream.id },
      data: {
        currentAmount: newCurrentAmount,
        status: updatedStatus,
        completedAt:
          updatedStatus === DreamStatus.COMPLETED && !dream.completedAt
            ? new Date()
            : dream.completedAt,
      },
    });

    // Notificações para sonhos também
    await this.handleDreamNotifications(
      user.householdId,
      updatedDream.id,
      updatedDream.name,
      percentage,
    );

    // Insight IA simples
    await this.maybeGenerateDreamInsight(userId, updatedDream, percentage);

    return updatedDream;
  }

  // ------------------------------------------
  // Histórico mensal das metas (snapshot)
  // -> pensado para ser chamado por um job mensal
  // ------------------------------------------
  async snapshotMonthlyGoals(householdId: string, month: number, year: number) {
    // Aqui poderíamos ter um modelo GoalHistory em Prisma.
    // Como ainda não existe no schema, vamos só deixar pronto
    // para implementar quando você criar o modelo:
    //
    // - Buscar metas da casa
    // - Gravar um "snapshot" com currentAmount / targetAmount
    //
    // Deixo a assinatura pronta para o RecurringJobsService usar.
    const goals = await this.prisma.goal.findMany({
      where: {
        householdId,
      },
    });

    // Exemplo: jogar esse snapshot em aIMessage.context por enquanto
    await this.prisma.aIMessage.create({
      data: {
        userId: (await this.getAnyUserFromHousehold(householdId)).id,
        message: `Snapshot mensal das metas (${month}/${year}) registrado.`,
        type: 'INSIGHT',
        tone: 'NEUTRAL',
        context: {
          month,
          year,
          goals: goals.map((g) => ({
            id: g.id,
            name: g.name,
            currentAmount: g.currentAmount,
            targetAmount: g.targetAmount,
          })),
        },
      },
    });

    return { householdId, month, year, goalsCount: goals.length };
  }

  // ------------------------------------------
  // Helpers privados
  // ------------------------------------------

  private async getAnyUserFromHousehold(householdId: string) {
    const user = await this.prisma.user.findFirst({
      where: { householdId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(
        'Nenhum usuário encontrado para este household',
      );
    }

    return user;
  }

  private async handleGoalNotifications(
    householdId: string,
    goalId: string,
    goalName: string,
    percentage: number,
  ) {
    // Buscar membros da casa
    const members = await this.prisma.user.findMany({
      where: { householdId },
      select: { id: true },
    });

    const notifications: Parameters<NotificationsService['create']>[0][] = [];

    if (percentage >= 80 && percentage < 100) {
      for (const member of members) {
        notifications.push({
          householdId,
          userId: member.id,
          title: 'Meta quase alcançada!',
          message: `A meta "${goalName}" já atingiu ${percentage.toFixed(
            1,
          )}% do valor planejado.`,
          type: NotificationType.GOAL_UPDATED,
          relatedId: goalId,
          relatedType: NotificationEntity.GOAL,
        });
      }
    }

    if (percentage >= 100) {
      for (const member of members) {
        notifications.push({
          householdId,
          userId: member.id,
          title: 'Meta concluída!',
          message: `Parabéns! A meta "${goalName}" foi concluída 🎉`,
          type: NotificationType.GOAL_UPDATED,
          relatedId: goalId,
          relatedType: NotificationEntity.GOAL,
        });
      }
    }

    for (const notif of notifications) {
      await this.notifications.create(notif);
    }
  }

  private async handleDreamNotifications(
    householdId: string,
    dreamId: string,
    dreamName: string,
    percentage: number,
  ) {
    const members = await this.prisma.user.findMany({
      where: { householdId },
      select: { id: true },
    });

    const notifications: Parameters<NotificationsService['create']>[0][] = [];

    if (percentage >= 80 && percentage < 100) {
      for (const member of members) {
        notifications.push({
          householdId,
          userId: member.id,
          title: 'Sonho a caminho! ✨',
          message: `O sonho "${dreamName}" já está em ${percentage.toFixed(
            1,
          )}% do valor desejado.`,
          type: NotificationType.DREAM_UPDATED,
          relatedId: dreamId,
          relatedType: NotificationEntity.DREAM,
        });
      }
    }

    if (percentage >= 100) {
      for (const member of members) {
        notifications.push({
          householdId,
          userId: member.id,
          title: 'Sonho realizado! 🎉',
          message: `Vocês realizaram o sonho "${dreamName}"!`,
          type: NotificationType.DREAM_UPDATED,
          relatedId: dreamId,
          relatedType: NotificationEntity.DREAM,
        });
      }
    }

    for (const notif of notifications) {
      await this.notifications.create(notif);
    }
  }

  private async maybeGenerateGoalInsight(
    userId: string,
    goal: {
      id: string;
      name: string;
      currentAmount: number;
      targetAmount: number;
    },
    percentage: number,
  ) {
    if (percentage < 50 && percentage !== 0) {
      await this.prisma.aIMessage.create({
        data: {
          userId,
          message: `Você já avançou ${percentage.toFixed(
            1,
          )}% na meta "${goal.name}". Que tal manter esse ritmo?`,
          type: 'INSIGHT',
          tone: 'ENCOURAGING',
          context: {
            goalId: goal.id,
            percentage,
          },
        },
      });
    }

    if (percentage >= 100) {
      await this.prisma.aIMessage.create({
        data: {
          userId,
          message: `Meta "${goal.name}" concluída! Excelente consistência no planejamento de vocês.`,
          type: 'INSIGHT',
          tone: 'CELEBRATORY',
          context: {
            goalId: goal.id,
            percentage,
          },
        },
      });
    }
  }

  private async maybeGenerateDreamInsight(
    userId: string,
    dream: {
      id: string;
      name: string;
      currentAmount: number;
      targetAmount: number;
    },
    percentage: number,
  ) {
    if (percentage < 50 && percentage !== 0) {
      await this.prisma.aIMessage.create({
        data: {
          userId,
          message: `O sonho "${dream.name}" já começou a ganhar forma. Vocês estão em ${percentage.toFixed(
            1,
          )}%.`,
          type: 'INSIGHT',
          tone: 'ENCOURAGING',
          context: {
            dreamId: dream.id,
            percentage,
          },
        },
      });
    }

    if (percentage >= 100) {
      await this.prisma.aIMessage.create({
        data: {
          userId,
          message: `Sonho "${dream.name}" realizado! Isso diz muito sobre o foco de vocês.`,
          type: 'INSIGHT',
          tone: 'CELEBRATORY',
          context: {
            dreamId: dream.id,
            percentage,
          },
        },
      });
    }
  }
}
