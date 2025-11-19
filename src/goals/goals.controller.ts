import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import * as authRequestType from '../auth/types/auth-request.type';

import { GoalsService } from './goals.service';
import { ContributionService } from './contribution.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly contributionService: ContributionService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // =====================================
  // CREATE GOAL
  // =====================================
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Criar uma nova meta' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Meta criada com sucesso' })
  @ApiBody({
    description: 'Dados da meta + imagem opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Economizar R$ 500/mês' },
        description: { type: 'string', nullable: true },
        targetAmount: { type: 'number', example: 500 },
        type: {
          type: 'string',
          enum: ['MONTHLY', 'ANNUAL', 'CUSTOM'],
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: new Date().toISOString(),
        },
        targetDate: {
          type: 'string',
          format: 'date-time',
          example: new Date().toISOString(),
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'targetAmount', 'type', 'startDate', 'targetDate'],
    },
  })
  async createGoal(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateGoalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinary.uploadImage(file, 'goals');
      imageUrl = uploaded.url;
    }

    return this.goalsService.create(req.user.id, dto, imageUrl);
  }

  // =====================================
  // LIST GOALS
  // =====================================
  @Get()
  @ApiOperation({ summary: 'Listar todas as metas do casal' })
  @ApiOkResponse({ description: 'Lista de metas retornada com sucesso' })
  listGoals(@Req() req: authRequestType.AuthRequest) {
    return this.goalsService.list(req.user.id);
  }

  // =====================================
  // GET ONE GOAL
  // =====================================
  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma meta específica' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Meta encontrada com sucesso' })
  getGoal(@Req() req: authRequestType.AuthRequest, @Param('id') id: string) {
    return this.goalsService.findOne(req.user.id, id);
  }

  // =====================================
  // UPDATE GOAL
  // =====================================
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Atualizar uma meta existente' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Meta atualizada com sucesso' })
  @ApiBody({
    description: 'Campos parciais da meta + imagem opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        targetAmount: { type: 'number', nullable: true },
        type: {
          type: 'string',
          enum: ['MONTHLY', 'ANNUAL', 'CUSTOM'],
          nullable: true,
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        targetDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        status: {
          type: 'string',
          enum: [
            'IN_PROGRESS',
            'COMPLETED',
            'DELAYED',
            'CANCELLED',
            'NEAR_COMPLETION',
          ],
          nullable: true,
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateGoal(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinary.uploadImage(file, 'goals');
      imageUrl = uploaded.url;
    }

    return this.goalsService.update(req.user.id, id, dto, imageUrl);
  }

  // =====================================
  // DELETE GOAL
  // =====================================
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar uma meta' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Meta deletada com sucesso' })
  deleteGoal(@Req() req: authRequestType.AuthRequest, @Param('id') id: string) {
    return this.goalsService.delete(req.user.id, id);
  }

  // =====================================
  // CONTRIBUTE TO GOAL
  // =====================================
  @Post(':id/contributions')
  @ApiOperation({ summary: 'Adicionar uma contribuição para a meta' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: CreateContributionDto })
  @ApiCreatedResponse({ description: 'Contribuição registrada' })
  contributeGoal(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.contributionService.contributeToGoal(req.user.id, id, dto);
  }

  // =====================================
  // SMART SUGGESTIONS
  // =====================================
  @Get('suggestions/smart')
  @ApiOperation({
    summary: 'Gerar sugestões inteligentes de metas',
    description:
      'Gera metas sugeridas automaticamente com base na renda, despesas e padrões do casal.',
  })
  @ApiOkResponse({
    description: 'Sugestões de metas geradas com sucesso',
  })
  smartSuggestions(@Req() req: authRequestType.AuthRequest) {
    return this.goalsService.smartSuggestions(req.user.id);
  }
}
