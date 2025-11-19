import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DomesticTaskEntryService } from './domestic-task-entry.service';
import { CreateDomesticTaskEntryDto } from './dto/create-domestic-task-entry.dto';
import * as authRequestType from '../auth/types/auth-request.type';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from 'src/common/swagger/swagger.decorators';
@ApiTags('Domestic Tasks')
@ApiBearerAuth()
@Controller('domestic-tasks')
export class DomesticTaskEntryController {
  constructor(private readonly service: DomesticTaskEntryService) {}

  @Post()
  @ApiOperationSummary(
    'Registrar tarefa doméstica',
    'Cria uma entrada de tarefa doméstica executada pelo usuário.',
  )
  @ApiResponse({ status: 201, description: 'Tarefa registrada com sucesso.' })
  @ApiStandardErrors()
  async create(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateDomesticTaskEntryDto,
  ) {
    return this.service.createEntry(req.user.id, dto);
  }

  @Get()
  @ApiOperationSummary(
    'Listar tarefas domésticas do mês',
    'Retorna todas as tarefas domésticas concluídas no mês/ano informado.',
  )
  @ApiQuery({ name: 'year', example: 2025, required: true })
  @ApiQuery({ name: 'month', example: 11, required: true })
  @ApiResponse({ status: 200 })
  @ApiStandardErrors()
  async list(
    @Req() req: authRequestType.AuthRequest,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = Number(year);
    const m = Number(month);

    if (!y || !m) {
      throw new BadRequestException('Informe year e month');
    }

    return this.service.listEntriesForMonth(req.user.id, y, m);
  }
}
