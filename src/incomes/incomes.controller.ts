import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeQueryDto } from './dto/income-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IncomeMonthlySummaryDto } from './dto/income-summary.dto';

@ApiTags('Incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar uma nova renda para o usuário logado' })
  create(@CurrentUser() user: any, @Body() dto: CreateIncomeDto) {
    return this.incomesService.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({
    summary:
      'Listar rendas do usuário logado (opcionalmente filtrando por mês/ano)',
  })
  findMyIncomes(@CurrentUser() user: any, @Query() query: IncomeQueryDto) {
    return this.incomesService.findMyIncomes(user.id, query);
  }

  @Get('household')
  @ApiOperation({
    summary: 'Listar rendas de toda a Casa Financeira (dos dois parceiros)',
  })
  findHouseholdIncomes(
    @CurrentUser() user: any,
    @Query() query: IncomeQueryDto,
  ) {
    return this.incomesService.findHouseholdIncomes(user.id, query);
  }

  @Get('summary/monthly')
  @ApiOperation({
    summary:
      'Resumo mensal da renda da Casa Financeira (total da casa + total por usuário)',
  })
  @ApiResponse({ status: 200, type: IncomeMonthlySummaryDto })
  getMonthlySummary(@CurrentUser() user: any, @Query() query: IncomeQueryDto) {
    return this.incomesService.getMonthlySummary(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma renda do usuário logado' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma renda do usuário logado' })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.incomesService.remove(user.id, id);
  }
}
