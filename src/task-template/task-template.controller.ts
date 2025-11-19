import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import * as authRequestType from 'src/auth/types/auth-request.type';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from '../common/swagger/swagger.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType, TaskWeight } from '@prisma/client';

export class TaskTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty({ enum: TaskType })
  type: TaskType;

  @ApiProperty({ enum: TaskWeight })
  weight: TaskWeight;

  @ApiProperty({ default: false })
  isBuiltIn: boolean;

  @ApiProperty({ default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

@ApiTags('Task Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('task-templates')
export class TaskTemplateController {
  constructor(private readonly service: TaskTemplateService) {}

  @Get()
  @ApiOperationSummary(
    'Listar modelos de tarefas',
    'Lista tarefas domésticas padrão e personalizadas da household do usuário.',
  )
  @ApiOkResponse({ type: TaskTemplateResponseDto, isArray: true })
  @ApiStandardErrors()
  async findAll(@Req() req: authRequestType.AuthRequest) {
    return this.service.findAllForUser(req.user.id) as Promise<
      TaskTemplateResponseDto[]
    >;
  }

  @Post()
  @ApiOperationSummary(
    'Criar modelo de tarefa',
    'Cria uma nova tarefa doméstica personalizada para a household.',
  )
  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiStandardErrors()
  async create(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateTaskTemplateDto,
  ) {
    return this.service.createCustom(
      req.user.id,
      dto,
    ) as Promise<TaskTemplateResponseDto>;
  }

  @Patch(':id')
  @ApiOperationSummary(
    'Atualizar modelo de tarefa',
    'Atualiza um modelo de tarefa existente.',
  )
  @ApiOkResponse({ type: TaskTemplateResponseDto })
  @ApiStandardErrors()
  async update(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskTemplateDto,
  ) {
    return this.service.update(
      req.user.id,
      id,
      dto,
    ) as Promise<TaskTemplateResponseDto>;
  }

  @Delete(':id')
  @ApiOperationSummary(
    'Excluir modelo de tarefa',
    'Marca um modelo de tarefa como inativo (soft delete).',
  )
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        deleted: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiStandardErrors()
  async remove(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
  ) {
    return this.service.softDelete(req.user.id, id);
  }
}
