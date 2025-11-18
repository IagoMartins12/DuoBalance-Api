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

@Controller('domestic-tasks')
export class DomesticTaskEntryController {
  constructor(private readonly service: DomesticTaskEntryService) {}

  @Post()
  async create(
    @Req() req: authRequestType.AuthRequest,
    @Body() dto: CreateDomesticTaskEntryDto,
  ) {
    return this.service.createEntry(req.user.id, dto);
  }

  @Get()
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
