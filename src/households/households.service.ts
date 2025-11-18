import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { JoinHouseholdDto } from './dto/join-household.dto';
import { UpdateSplitDto } from './dto/update-split.dto';
import { SplitMethod } from '@prisma/client';

@Injectable()
export class HouseholdsService {
  constructor(private prisma: PrismaService) {}

  private generateInviteCode(): string {
    // Código simples e curto; podemos sofisticar depois se quiser
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private validateCustomSplit(split?: {
    user1Percentage: number;
    user2Percentage: number;
  }) {
    if (!split) return;
    const total = split.user1Percentage + split.user2Percentage;
    if (total !== 100) {
      throw new BadRequestException(
        'Em divisões customizadas, as porcentagens devem somar 100%',
      );
    }
  }

  async createHousehold(userId: string, dto: CreateHouseholdDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.householdId) {
      throw new BadRequestException(
        'Usuário já está vinculado a uma Casa Financeira',
      );
    }

    const splitMethod = dto.splitMethod ?? SplitMethod.FIFTY_FIFTY;

    if (splitMethod === SplitMethod.CUSTOM) {
      this.validateCustomSplit(dto.customSplit);
    }

    let inviteCode: string;
    // Garante unicidade do código
    // (poucos loops na prática)

    while (true) {
      inviteCode = this.generateInviteCode();
      const existing = await this.prisma.household.findFirst({
        where: { inviteCode },
      });
      if (!existing) break;
    }

    const household = await this.prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: {
          name: dto.name,
          inviteCode,
          splitMethod,
          customSplit:
            splitMethod === SplitMethod.CUSTOM && dto.customSplit
              ? {
                  user1Percentage: dto.customSplit.user1Percentage,
                  user2Percentage: dto.customSplit.user2Percentage,
                }
              : null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { householdId: created.id },
      });

      return created;
    });

    return this.getHouseholdWithMembers(household.id);
  }

  async getMyHousehold(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new NotFoundException(
        'Usuário não está vinculado a nenhuma Casa Financeira',
      );
    }

    return this.getHouseholdWithMembers(user.householdId);
  }

  private async getHouseholdWithMembers(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            name: true,
            photo: true,
            color: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Casa Financeira não encontrada');
    }

    return household;
  }

  async joinHousehold(userId: string, dto: JoinHouseholdDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.householdId) {
      throw new BadRequestException(
        'Usuário já está vinculado a uma Casa Financeira',
      );
    }

    const household = await this.prisma.household.findFirst({
      where: {
        inviteCode: dto.inviteCode,
        isActive: true,
      },
    });

    if (!household) {
      throw new NotFoundException('Casa Financeira não encontrada ou inativa');
    }

    const membersCount = await this.prisma.user.count({
      where: { householdId: household.id },
    });

    if (membersCount >= 2) {
      throw new BadRequestException(
        'Esta Casa Financeira já possui dois membros',
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { householdId: household.id },
    });

    return this.getHouseholdWithMembers(household.id);
  }

  async leaveHousehold(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.householdId) {
      throw new BadRequestException(
        'Usuário não está vinculado a nenhuma Casa Financeira',
      );
    }

    const householdId = user.householdId;

    await this.prisma.user.update({
      where: { id: userId },
      data: { householdId: null },
    });

    const remaining = await this.prisma.user.count({
      where: { householdId },
    });

    if (remaining === 0) {
      await this.prisma.household.update({
        where: { id: householdId },
        data: { isActive: false },
      });
    }

    return { success: true };
  }

  async updateSplitMethod(
    userId: string,
    householdId: string,
    dto: UpdateSplitDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.householdId !== householdId) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar esta Casa Financeira',
      );
    }

    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
    });

    if (!household || !household.isActive) {
      throw new NotFoundException('Casa Financeira não encontrada ou inativa');
    }

    const splitMethod = dto.splitMethod ?? household.splitMethod;

    if (splitMethod === SplitMethod.CUSTOM) {
      this.validateCustomSplit(dto.customSplit);
    }

    const updated = await this.prisma.household.update({
      where: { id: householdId },
      data: {
        splitMethod,
        customSplit:
          splitMethod === SplitMethod.CUSTOM && dto.customSplit
            ? {
                user1Percentage: dto.customSplit.user1Percentage,
                user2Percentage: dto.customSplit.user2Percentage,
              }
            : null,
      },
    });

    return this.getHouseholdWithMembers(updated.id);
  }
}
