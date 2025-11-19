import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import * as authRequestType from '../auth/types/auth-request.type';
import {
  ApiAuth,
  ApiOperationSummary,
  ApiOk,
  ApiCreated,
  ApiStandardErrors,
} from '../common/swagger/swagger.decorators';
import { DeleteBudgetResponseDto } from './dto/delete-budget-response.dto';

@ApiTags('Budgets')
@ApiAuth()
@Controller('budgets')
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Post()
  @ApiOperationSummary(
    'Criar orçamento',
    'Cria um orçamento por categoria para um mês/ano.',
  )
  @ApiCreated(BudgetResponseDto)
  @ApiStandardErrors()
  create(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @ApiOperationSummary(
    'Listar orçamentos do mês',
    'Retorna todos os orçamentos da household do usuário para um mês/ano.',
  )
  @ApiQuery({
    name: 'month',
    required: true,
    type: Number,
    example: 11,
    description: 'Mês (1-12).',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    example: 2025,
    description: 'Ano (ex: 2025).',
  })
  @ApiOk(BudgetResponseDto, 'Lista de orçamentos')
  @ApiStandardErrors()
  list(
    @Req() req: authRequestType.AuthRequest,
    @Query('month') month: string,
    @Query('year') year: string,
  ): Promise<BudgetResponseDto[]> {
    return this.service.list(req.user.id, Number(month), Number(year));
  }

  @Patch(':id')
  @ApiOperationSummary(
    'Atualizar orçamento',
    'Atualiza dados do orçamento e recalcula o progresso.',
  )
  @ApiOk(BudgetResponseDto)
  @ApiStandardErrors()
  update(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.service.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperationSummary(
    'Excluir orçamento',
    'Remove um orçamento da household do usuário.',
  )
  @ApiResponse({ status: 200, type: DeleteBudgetResponseDto })
  @ApiStandardErrors()
  delete(
    @Req() req: authRequestType.AuthRequest,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    return this.service.delete(req.user.id, id);
  }
}
