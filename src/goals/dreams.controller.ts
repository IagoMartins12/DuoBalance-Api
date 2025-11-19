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

import { DreamsService } from './dreams.service';
import { ContributionService } from './contribution.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';

@ApiTags('Dreams')
@ApiBearerAuth()
@Controller('dreams')
export class DreamsController {
  constructor(
    private readonly dreamsService: DreamsService,
    private readonly contributionService: ContributionService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // =====================================
  // CREATE DREAM
  // =====================================
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Criar um sonho (macro objetivo)' })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ description: 'Sonho criado com sucesso' })
  @ApiBody({
    description: 'Dados do sonho + imagem motivacional opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Viagem para Paris' },
        description: { type: 'string', nullable: true },
        targetAmount: { type: 'number', example: 15000 },
        targetDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          example: 'HIGH',
        },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'targetAmount'],
    },
  })
  async createDream(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateDreamDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinary.uploadImage(file, 'dreams');
      imageUrl = uploaded.url;
    }

    return this.dreamsService.create(req.user.id, dto, imageUrl);
  }

  // =====================================
  // LIST DREAMS
  // =====================================
  @Get()
  @ApiOperation({ summary: 'Listar todos os sonhos do casal' })
  @ApiOkResponse({ description: 'Lista de sonhos retornada com sucesso' })
  listDreams(@Req() req: authRequestType.AuthRequest) {
    return this.dreamsService.list(req.user.id);
  }

  // =====================================
  // GET ONE DREAM
  // =====================================
  @Get(':id')
  @ApiOperation({ summary: 'Buscar um sonho específico' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Sonho encontrado com sucesso' })
  getDream(@Req() req: authRequestType.AuthRequest, @Param('id') id: string) {
    return this.dreamsService.findOne(req.user.id, id);
  }

  // =====================================
  // UPDATE DREAM
  // =====================================
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Atualizar um sonho' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Sonho atualizado com sucesso' })
  @ApiBody({
    description: 'Campos parciais do sonho + nova imagem opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', nullable: true },
        description: { type: 'string', nullable: true },
        targetAmount: { type: 'number', nullable: true },
        targetDate: {
          type: 'string',
          format: 'date-time',
          nullable: true,
        },
        status: {
          type: 'string',
          enum: ['IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'],
          nullable: true,
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          nullable: true,
        },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateDream(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDreamDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (file) {
      const uploaded = await this.cloudinary.uploadImage(file, 'dreams');
      imageUrl = uploaded.url;
    }

    return this.dreamsService.update(req.user.id, id, dto, imageUrl);
  }

  // =====================================
  // DELETE DREAM
  // =====================================
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar um sonho' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Sonho deletado com sucesso' })
  deleteDream(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
  ) {
    return this.dreamsService.delete(req.user.id, id);
  }

  // =====================================
  // CONTRIBUTE TO DREAM
  // =====================================
  @Post(':id/contributions')
  @ApiOperation({ summary: 'Adicionar contribuição em um sonho' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: CreateContributionDto })
  @ApiCreatedResponse({ description: 'Contribuição registrada' })
  contributeDream(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateContributionDto,
  ) {
    return this.contributionService.contributeToDream(req.user.id, id, dto);
  }
}
