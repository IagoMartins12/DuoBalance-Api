import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDomesticTaskEntryDto } from './dto/create-domestic-task-entry.dto';

@Injectable()
export class DomesticTaskEntryService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserWithHousehold(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, householdId: true },
    });

    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a nenhuma casa');
    }

    return user;
  }

  async createEntry(userId: string, dto: CreateDomesticTaskEntryDto) {
    const user = await this.getUserWithHousehold(userId);
    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }
    const template = await this.prisma.taskTemplate.findUnique({
      where: { id: dto.templateId },
      select: {
        id: true,
        householdId: true,
        isBuiltIn: true,
        isActive: true,
      },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException('Tarefa não encontrada ou inativa');
    }

    // se não for built-in, precisa ser da mesma casa
    if (!template.isBuiltIn && template.householdId !== user.householdId) {
      throw new ForbiddenException('Você não pode usar esta tarefa');
    }

    const completedAt = dto.completedAt
      ? new Date(dto.completedAt)
      : new Date();

    return this.prisma.domesticTaskEntry.create({
      data: {
        householdId: user.householdId,
        userId: user.id,
        templateId: template.id,
        hours: dto.hours,
        note: dto.note,
        completedAt,
      },
    });
  }

  async listEntriesForMonth(userId: string, year: number, month: number) {
    const user = await this.getUserWithHousehold(userId);
    if (!user || !user.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }
    return this.prisma.domesticTaskEntry.findMany({
      where: {
        householdId: user.householdId,
        completedAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        completedAt: true,
        hours: true,
        note: true,
        template: {
          select: { name: true, type: true, weight: true },
        },
      },
    });
  }
}
