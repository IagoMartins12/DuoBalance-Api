import { Module } from '@nestjs/common';
import { DomesticEquityService } from './domestic-equity.service';
import { DomesticEquityController } from './domestic-equity.controller';
import { PrismaService } from '../prisma/prisma.service';
import { DomesticTaskEntryModule } from '../domestic-task-entry/domestic-task-entry.module';

@Module({
  imports: [DomesticTaskEntryModule],
  controllers: [DomesticEquityController],
  providers: [DomesticEquityService, PrismaService],
  exports: [DomesticEquityService],
})
export class DomesticEquityModule {}
