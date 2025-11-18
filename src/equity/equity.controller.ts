import {
  Controller,
  Get,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { EquityService } from './equity.service';
import * as authRequestType from '../auth/types/auth-request.type';

@Controller('equity')
export class EquityController {
  constructor(private readonly equityService: EquityService) {}

  @Get('monthly')
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
