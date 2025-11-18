import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';

@Injectable()
export class TaskTemplateService {
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

  async findAllForUser(userId: string) {
    const user = await this.getUserWithHousehold(userId);

    return this.prisma.taskTemplate.findMany({
      where: {
        isActive: true,
        OR: [{ isBuiltIn: true }, { householdId: user.householdId }],
      },
      orderBy: { name: 'asc' },
    });
  }

  async createCustom(userId: string, dto: CreateTaskTemplateDto) {
    const user = await this.getUserWithHousehold(userId);

    return this.prisma.taskTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        weight: dto.weight,
        isBuiltIn: false,
        householdId: user.householdId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskTemplateDto) {
    const user = await this.getUserWithHousehold(userId);

    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Tarefa não encontrada');

    // só permite editar se for da casa ou se for built-in (mas somente desativar)
    if (!template.isBuiltIn) {
      if (template.householdId !== user.householdId) {
        throw new ForbiddenException('Você não pode editar esta tarefa');
      }

      return this.prisma.taskTemplate.update({
        where: { id },
        data: {
          name: dto.name ?? template.name,
          description: dto.description ?? template.description,
          type: dto.type ?? template.type,
          weight: dto.weight ?? template.weight,
        },
      });
    }

    // se for built-in, só permitimos desativar (isActive = false)
    if (dto) {
      // para simplificar, só tratamos isActive futuramente
      // por enquanto, você poderia expor um endpoint específico para isso
    }

    throw new ForbiddenException('Não é permitido editar tarefa padrão');
  }

  async softDelete(userId: string, id: string) {
    const user = await this.getUserWithHousehold(userId);

    const template = await this.prisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!template) throw new NotFoundException('Tarefa não encontrada');

    if (template.isBuiltIn && !template.householdId) {
      throw new ForbiddenException('Não é permitido excluir tarefa padrão');
    }

    if (template.householdId !== user.householdId) {
      throw new ForbiddenException('Você não pode excluir esta tarefa');
    }

    return this.prisma.taskTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
