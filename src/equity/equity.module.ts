import { Module } from '@nestjs/common';
import { EquityService } from './equity.service';
import { EquityController } from './equity.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SplitService } from '../split/split.service';

@Module({
  controllers: [EquityController],
  providers: [EquityService, PrismaService, SplitService],
  exports: [EquityService],
})
export class EquityModule {}
