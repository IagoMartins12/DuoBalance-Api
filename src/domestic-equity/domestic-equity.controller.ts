import {
  Controller,
  Get,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DomesticEquityService } from './domestic-equity.service';
import * as authRequestType from '../auth/types/auth-request.type';
import { ApiTags, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiOperationSummary,
  ApiStandardErrors,
} from 'src/common/swagger/swagger.decorators';

@ApiTags('Domestic Equity')
@ApiBearerAuth()
@Controller('domestic-equity')
export class DomesticEquityController {
  constructor(private readonly service: DomesticEquityService) {}

  @Get('monthly')
  @ApiOperationSummary(
    'Equidade doméstica mensal',
    'Retorna os pontos e porcentagem de tarefas domésticas entre o casal para o mês/ano informado.',
  )
  @ApiQuery({ name: 'year', example: 2025, required: true })
  @ApiQuery({ name: 'month', example: 11, required: true })
  @ApiResponse({
    status: 200,
    description: 'Equidade doméstica calculada com sucesso.',
  })
  @ApiStandardErrors()
  async getMonthly(
    @Req() req: authRequestType.AuthRequest,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = Number(year);
    const m = Number(month);

    if (!y || !m) {
      throw new BadRequestException('Informe year e month corretamente');
    }

    return this.service.getMonthlyDomesticEquity(req.user.id, y, m);
  }
}
