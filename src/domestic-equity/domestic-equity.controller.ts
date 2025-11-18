import {
  Controller,
  Get,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DomesticEquityService } from './domestic-equity.service';
import * as authRequestType from '../auth/types/auth-request.type';

@Controller('domestic-equity')
export class DomesticEquityController {
  constructor(private readonly service: DomesticEquityService) {}

  @Get('monthly')
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
