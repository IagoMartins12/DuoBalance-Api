import {
  Controller,
  Get,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { EquityService } from './equity.service';
import * as authRequestType from '../auth/types/auth-request.type';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from 'src/common/swagger/swagger.decorators';

@ApiTags('Equity')
@ApiBearerAuth()
@Controller('equity')
export class EquityController {
  constructor(private readonly equityService: EquityService) {}

  @Get('monthly')
  @ApiOperationSummary(
    'Equidade mensal completa (financeira + doméstica)',
    'Calcula o balanço entre os membros considerando despesas, rendas e tarefas domésticas.',
  )
  @ApiQuery({ name: 'year', example: 2025, required: true })
  @ApiQuery({ name: 'month', example: 11, required: true })
  @ApiResponse({
    status: 200,
    description: 'Equidade calculada com sucesso.',
  })
  @ApiStandardErrors()
  async getMonthlyEquity(
    @Req() req: authRequestType.AuthRequest,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = Number(year);
    const m = Number(month);

    if (!y || !m) {
      throw new BadRequestException('Informe year e month corretamente');
    }

    return this.equityService.getMonthlyEquity(req.user.id, y, m);
  }
}
