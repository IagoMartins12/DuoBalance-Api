import { Module } from '@nestjs/common';
import { DomesticTaskEntryService } from './domestic-task-entry.service';
import { DomesticTaskEntryController } from './domestic-task-entry.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TaskTemplateModule } from '../task-template/task-template.module';

@Module({
  imports: [TaskTemplateModule],
  controllers: [DomesticTaskEntryController],
  providers: [DomesticTaskEntryService, PrismaService],
  exports: [DomesticTaskEntryService],
})
export class DomesticTaskEntryModule {}
