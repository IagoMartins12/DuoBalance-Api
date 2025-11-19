import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { DreamStatus } from '@prisma/client';
import { AddContributionDto } from 'src/goals/dto/add-contribution.dto';

@Injectable()
export class DreamsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getHouseholdIdOrThrow(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      throw new ForbiddenException('Usuário não pertence a uma casa');
    }

    return user.householdId;
  }

  // CREATE
  async create(userId: string, dto: CreateDreamDto, imageUrl?: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const dream = await this.prisma.dream.create({
      data: {
        householdId,
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        currentAmount: 0,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        status: DreamStatus.IN_PROGRESS,
        priority: dto.priority ?? 'MEDIUM',
        imageUrl: imageUrl ?? null,
      },
    });

    return dream;
  }

  // LIST
  async list(userId: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    return this.prisma.dream.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // FIND ONE
  async findOne(userId: string, id: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const dream = await this.prisma.dream.findFirst({
      where: { id, householdId },
    });

    if (!dream) {
      throw new NotFoundException('Sonho não encontrado');
    }

    return dream;
  }

  // UPDATE
  async update(
    userId: string,
    id: string,
    dto: UpdateDreamDto,
    imageUrl?: string,
  ) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const dream = await this.prisma.dream.findFirst({
      where: { id, householdId },
    });

    if (!dream) {
      throw new NotFoundException('Sonho não encontrado');
    }

    const updated = await this.prisma.dream.update({
      where: { id },
      data: {
        ...dto,
        imageUrl: imageUrl ?? dream.imageUrl,
        targetDate: dto.targetDate
          ? new Date(dto.targetDate)
          : dream.targetDate,
      },
    });

    return updated;
  }

  // DELETE
  async delete(userId: string, id: string) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const dream = await this.prisma.dream.findFirst({
      where: { id, householdId },
    });

    if (!dream) {
      throw new NotFoundException('Sonho não encontrado');
    }

    await this.prisma.dream.delete({ where: { id } });

    return { deleted: true };
  }

  // ADD CONTRIBUTION
  async addContribution(
    userId: string,
    dreamId: string,
    dto: AddContributionDto,
  ) {
    const householdId = await this.getHouseholdIdOrThrow(userId);

    const dream = await this.prisma.dream.findFirst({
      where: { id: dreamId, householdId },
    });

    if (!dream) {
      throw new NotFoundException('Sonho não encontrado');
    }

    const date = dto.date ? new Date(dto.date) : new Date();

    await this.prisma.contribution.create({
      data: {
        dreamId,
        goalId: null,
        amount: dto.amount,
        date,
        note: dto.note ?? null,
      },
    });

    const agg = await this.prisma.contribution.aggregate({
      _sum: { amount: true },
      where: { dreamId },
    });

    const newCurrent = agg._sum.amount ?? 0;
    const updated = await this.prisma.dream.update({
      where: { id: dreamId },
      data: {
        currentAmount: newCurrent,
      },
    });

    return updated;
  }
}
